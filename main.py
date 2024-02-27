import shutil
import subprocess
import psutil
from runner_client import get_essex_analysis
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from gpt import get_alternative_descriptions, get_taxonomy
from pathlib import Path
from random import randint


class RuleGenerator:
    def __init__(self):
        self.default_pos_to_ignore = ["ART", "CON", "PNT", "PRE", "PRO", "PRT"]
        self.default_lemmas_to_ignore = ["non", "specificare", "specificato", "altro"]
        self.variable_types = ['ADR', 'ANM', 'BLD', 'COM', 'DAT', 'DEV', 'DOC', 'ENT', 'EVN', 'FDD', 'GEA', 'GEO', 'GEX',
                               'HOU', 'LEN', 'MAI', 'MEA', 'MMD', 'MON', 'NPH', 'ORG', 'PCT', 'PHO', 'PPH', 'PRD', 'VCL',
                               'WEB', 'WRK']
        self.rules_out_path = Path("generated_rules")
        self.cmd_file_path = "cpk_runner.cmd"

    def is_relevant_pos(self, token, pos_to_ignore=None):
        if not pos_to_ignore:
            pos_to_ignore = self.default_pos_to_ignore

        return token["type"] not in pos_to_ignore

    def get_relevant_parts_of_speech(self, sentence):
        data = {
            "projectId": "automazione",
            "text": sentence,
            "analysis": [
                "ENTITIES",
                "DISAMBIGUATION",
                "RELATIONS",
                "CATEGORIES",
                "SENTIMENT",
                "RELEVANTS",
                "EXTRACTIONS"
            ],
            "features": [
                "DEPENDENCY_TREE",
                "POSITIONS_SYNCHRONIZATION",
                "KNOWLEDGE",
                "EXTRA_DATA",
                "EXTERNAL_IDS"
            ]
        }
        # if analysis:
        analysis = get_essex_analysis(data)["result"]
        tokens = analysis["extraData"]["all_syncons"]
        
        relevant_tokens = []
        for token in tokens:
            if token["lemma"] not in self.default_lemmas_to_ignore:
                is_relevant = self.is_relevant_pos(token)
                if is_relevant:
                    relevant_tokens.append(token)

        if not relevant_tokens:
            words = sentence.split()
            for w in words:
                if w not in self.default_lemmas_to_ignore:
                    is_relevant = self.is_relevant_pos(token)
                    if len(w) > 4:
                        fabricated_token = {
                            "syncon": [],
                            "score": 0,
                            "start": str(sentence).find(w),
                            "end": str(sentence).find(w) + len(w),
                            "type": "UNKNOWN",
                            "lemma": w,
                        }
                        relevant_tokens.append(fabricated_token)

        # print(relevant_tokens)
        return relevant_tokens

    def get_syncon(self, token, pos_to_ignore=None):
        if not pos_to_ignore:
            pos_to_ignore = self.default_pos_to_ignore

        if token["syncon"]:
            return token["syncon"][0]
        elif not token["syncon"] and token["type"] not in pos_to_ignore:
            return "virtual_sync"
        else:
            return False


    def all_digits(self, input_string):
        return all(char.isdigit() for char in input_string)

    def clean_text(self, text):
        new_text = text.lower()
        new_text = new_text.replace("'", " ")
        new_text = re.sub(r'[^a-zA-Z0-9_\s]', '', new_text)
        new_text = new_text.replace(" ", "_")
        return new_text

    def generate_rule(self, domain, tokens, domain_description, distance_operator):
        if tokens:
            rule = f'    DOMAIN[{domain_description}_id{randint(1,9999)}]({domain["NAME"]}) {{\n'
            for idx, token in enumerate(tokens):
                token_syncon = self.get_syncon(token)
                if token_syncon and token_syncon != "virtual_sync":
                    sub_type = token["type"].split(".")[1] if len(token["type"].split(".")) > 1 else None
                    token_syncon_string = ", ".join(str(s) for s in token["syncon"]) if len(token["syncon"]) > 1 else str(token["syncon"][0])
                    if not sub_type in self.variable_types:
                        # rule += f'        MANDATORY{{\n            LEMMA("{token["lemma"]}"),\n            SYNCON({token_syncon_string}) // {token["lemma"]}\n        }}\n'
                        rule += f'        LIST({token_syncon_string}) // {token["lemma"]}\n'
                    else:
                        rule += f'        MANDATORY{{\n            LIST({token_syncon_string}) // {token["lemma"]},\n            TYPE({token["type"]})\n        }}\n'
                else:
                    low_lemma = token["lemma"].lower()
                    if self.all_digits(low_lemma):
                        rule += f'        PATTERN("(?i){low_lemma}")\n'
                    else:
                        if low_lemma[-1].isalpha():  # avoids truncating stuff like codes
                            if not token["lemma"].isupper():  # avoids truncating stuff like acronyms
                                if low_lemma[-2] == 'h':  # soniche -> sonic.+ invece di sonich.+
                                    rule += f'        PATTERN("(?i){low_lemma[:-2]}.+")\n'
                                else:
                                    if len(low_lemma) > 3:  # avoids truncating due -> du.+
                                        rule += f'        PATTERN("(?i){low_lemma[:-1]}.+")\n'
                                    else:
                                        rule += f'        PATTERN("(?i){low_lemma}")\n'
                            else:
                                rule += f'        PATTERN("{token["lemma"]}")\n'
                        else:
                            rule += f'        PATTERN("(?i){low_lemma}")\n'


                if idx != len(tokens)-1:
                    rule += f'        <:{str(distance_operator)}>\n'
            rule += '    }\n\n\n'

            return(rule)
        else:
            return ""

    def generate_rules_file(self, domain, distance_operator, possible_descriptions=None, domain_directory=None):
        if not possible_descriptions:
            possible_descriptions = [domain["DESCRIPTION"]]
        else:
            if domain["DESCRIPTION"] not in possible_descriptions:
                possible_descriptions = [domain["DESCRIPTION"]] + possible_descriptions
        rules = [self.generate_rule(domain, self.get_relevant_parts_of_speech(desc), self.clean_text(desc), distance_operator) for desc in possible_descriptions]
        
        nl = "\n"
        text = f"""
{nl.join([f"// {desc}" for desc in possible_descriptions])}
\n\nSCOPE SENTENCE
{{
{nl.join(rules)}
}}
    """
        with open(f"{domain_directory}/auto_{domain['NAME']}.cr", "w", encoding="utf8") as f:
            f.write(text)

    def get_all_domains(self, taxonomy_string):
        print("[+] Getting domains from taxonomy")
        root = ET.fromstring(taxonomy_string)
        
        domains_list = []
        for domain in root.findall('.//DOMAIN'):
            domain_info = {
                'NAME': domain.get('NAME'),
                'DESCRIPTION': domain.get('DESCRIPTION')
            }
            domains_list.append(domain_info)
        return domains_list

    def generate_rule_files_per_domain(self):
        generated_files_so_far = [f.stem for f in Path("generated_rules").glob("*")]
        for idx, d in enumerate(self.domains):
            if d["NAME"] not in generated_files_so_far:
                description = d["DESCRIPTION"]
                if description not in "no description available":
                    print(f"[+] Generating rules for domain {d['DESCRIPTION']} ({idx + 1} / {len(self.domains)})")
                    alternative_descriptions = get_alternative_descriptions(d["DESCRIPTION"])
                    self.generate_rules_file(d, self.distance_operator, possible_descriptions=alternative_descriptions, domain_directory=self.domain_directory)

    def write_imports(self):
        imports_path = self.cpkrules_domain_directory / f"main_cat_{self.general_domain}.cr"
        if isinstance(imports_path, str):
            imports_path = Path(imports_path)
        all_files_in_folder = [f for f in imports_path.parent.glob("auto_*")]
        if imports_path.name not in [f.name for f in all_files_in_folder]:
            with open(f"{imports_path}", "a", encoding="utf8") as f:  
                for file in all_files_in_folder:
                    f.write(f"IMPORT \"{file.name}\"\n")

    def clean_domain_directory(self):
        for file_path in self.domain_directory.glob("auto_*"):
            try:
                file_path.unlink()  # Remove the file
                print(f"[-] Removed: {file_path}")
            except Exception as e:
                print(f"Error removing {file_path}: {e}")

    def refresh_cpkrules_directory(self):
        for file_path in self.cpkrules_directory.glob("*"):
            try:
                if file_path.is_dir() and file_path.name != "dic":
                    shutil.rmtree(file_path)
                    print(f"[-] Removed directory: {file_path}")
            except Exception as e:
                print(f"Error removing {file_path}: {e}")
        with open(self.cpkrules_directory / "main.cr", "w", encoding="utf8"):
            pass

    def copy_rules_to_cpkrules_domain_directory(self):
        auto_files = list(self.domain_directory.glob("auto_*"))
        for auto_file in auto_files:
            with open(auto_file, "r", encoding="utf8") as inp:
                content = inp.read()
            with open(self.cpkrules_domain_directory / auto_file.name, "w", encoding="utf8") as f:
                f.write(content)
                print(f"Copied: {auto_file} to {self.cpkrules_domain_directory} directory")
        
        with open(Path(self.cpkrules_directory / "main.cr"), "w", encoding="utf8") as m:
            m.write(f"IMPORT \"{self.general_domain}/main_cat_{self.general_domain}.cr\"")


    def start_runner(self):
        try:
            subprocess.Popen(['cmd', '/c', self.cmd_file_path], shell=True)
        except Exception as e:
            print(f"Error executing CMD file: {e}")

    def kill_runner(self):
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                if proc.info['name'] == 'cmd.exe' and self.cmd_file_path in proc.info['cmdline']:
                    process = psutil.Process(proc.info['pid'])
                    process.terminate()
                    print(f"Terminated CMD process for {self.cmd_file_path}")
        except Exception as e:
            print(f"Error terminating CMD process: {e}")


    def main(self):
        from_what = input("Vuoi generare da file tassonomia XML o da dominio generico? t = tassonomia d = dominio generico (t/d): ").lower()
        self.distance_operator = input("Distance operator (numero): ")

        if from_what == "d":
            self.start_domain_based_generation()
        elif from_what == "t":
            self.start_taxonomy_based_generation()

    def start_domain_based_generation(self):

        self.general_domain = input("Per quale dominio vuoi generare tassonomia e regole? (Es. 'Auotomotive', 'Cloud services', etc...)\n")
        self.cpkrules_directory = Path("cpk/rules")
        self.domain_directory = self.rules_out_path.joinpath(self.general_domain)
        self.domain_directory.mkdir(exist_ok=True)
        self.clean_domain_directory()

        self.refresh_cpkrules_directory()
        self.cpkrules_domain_directory = self.cpkrules_directory / self.general_domain
        self.cpkrules_domain_directory.mkdir(exist_ok=True)
        
        self.start_runner()

        taxonomy_str = get_taxonomy(self.general_domain, minimum_elements=5, domain_directory=self.domain_directory)
        self.domains = self.get_all_domains(taxonomy_str)

        self.generate_rule_files_per_domain()
        self.write_imports()

        self.copy_rules_to_cpkrules_domain_directory()



    # def start_taxonomy_based_generation(self, distance_operator):
    #     imports_path = "generated_rules/main_cat_pythonic_rules_essex.cr"
    #     tax_file = input("Percorso tassonomia xml:\n")
    #     with open(tax_file, "r", encoding="utf8") as f:
    #         taxonomy_str = f.read()
    #     domains = self.get_all_domains(taxonomy_str)
    #     self.write_imports(domains, imports_path)
    #     self.generate_rule_files_per_domain(domains, distance_operator)


if __name__ == "__main__":
    rule_generator = RuleGenerator()
    rule_generator.main()