#  file per rigenerare le regole con i syncon giusti (esterni) usando le alternative di chatgpt pregenerate dalla prima esecuzione

from rule_generation import get_all_domains, write_imports, generate_rules_file, get_syncon, variable_types, all_digits
from pathlib import Path
import re


def get_original_alternative_descriptions(rule_files, domain_name):
    file = [r for r in rule_files if r.stem == domain_name][0]
    pattern = r'//\s*(.*?)\n(?!\s+})'

    with open(file, "r", encoding="UTF8") as f:
        content = f.read()
        sentences = re.findall(pattern, content)

    return sentences





def generate_rule_files_per_domain(domains, distance_operator):
    generated_files_so_far = [f for f in Path("generated_rules").glob("*")]
    for idx, d in enumerate(domains):
        description = d["DESCRIPTION"]
        if description not in "no description available":
            # if d["NAME"] not in [f.stem for f in generated_files_so_far]:
            print(f"[+] Generating rules for domain {d['NAME']} {d['DESCRIPTION']} ({idx + 1} / {len(domains)})")
            # alternative_descriptions = get_alternative_descriptions(d["DESCRIPTION"])
            alternative_descriptions = get_original_alternative_descriptions(generated_files_so_far, d["NAME"])
            generate_rules_file(d, distance_operator, possible_descriptions=alternative_descriptions)


def main():
    imports_path = "generated_rules/main_cat_pythonic_rules_essex.cr"
    from_what = input("Vuoi generare da file tassonomia XML o da dominio generico? t = tassonomia d = dominio generico (t/d): ").lower()
    distance_operator = input("Distance operator (numero): ")

    if not from_what:
        from_what = "t"
    if not distance_operator:
        distance_operator = 8
        
    if from_what == "d":
        pass
        # general_domain = input("Per quale dominio vuoi generare tassonomia e regole? (Es. 'Auotomotive', 'Cloud services', etc...)\n")
        # taxonomy_str = get_taxonomy(general_domain, minimum_elements=10)
        # domains = get_all_domains(taxonomy_str)
        # write_imports(domains, imports_path)
        # generate_rule_files_per_domain(domains, distance_operator)
    elif from_what == "t":
        tax_file = input("Percorso tassonomia xml:\n")
        if not tax_file:
            tax_file = "icd9.xml"
        with open(tax_file, "r", encoding="utf8") as f:
            taxonomy_str = f.read()
        domains = get_all_domains(taxonomy_str)
        write_imports(domains, imports_path)
        generate_rule_files_per_domain(domains, distance_operator)


if __name__ == "__main__":
    main()