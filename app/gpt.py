from openai import OpenAI
from dotenv import load_dotenv
import xml.etree.ElementTree as ET
import time
from helper_funcs import clean_text

load_dotenv()

client = OpenAI()

def get_alternative_descriptions(original_desc):
    max_retries = 5
    retry_delay = 3
    for attempt in range(max_retries):
        try:
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Genera una lista di espressioni linguistiche alternative per esprimere il concetto fornito dall'utente. Rispondi SEMPRE in formato - Espressione."},
                    {"role": "user", "content": f"Genera una lista di espressioni linguistiche alternative per esprimere il concetto seguente: {original_desc}\n\n### Rispondi SEMPRE in formato - Espressione."}
                ]
            )

            content = completion.choices[0].message.content
            expressions = []
            for line in content.strip().split('\n'):
                if line:
                    exp = line.strip()
                    if line.startswith("- "):
                        exp = exp[2:]
                        expressions.append(exp)
                    elif line.startswith("-"):
                        exp = exp[1:]
                        expressions.append(exp)
                    elif line[0].isdigit():
                        exp = exp[3:]
                        expressions.append(exp)
                    else:
                        expressions.append(exp)

            return expressions

        except:
            # Handle the error (e.g., log it)
            print(f"Error from OpenAI")

            if attempt < max_retries:
                # Retry after a delay
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                # Maximum retries reached, return a default value or raise an exception
                print("Max retries reached.")
                raise ValueError("Error generating alternative descriptions") 


def save_tax(content, domain_directory):
    with open(f"{domain_directory}/taxonomy.xml", "w", encoding="utf8") as tax:
        tax.write(content)


def get_taxonomy(domain, minimum_elements=70, domain_directory=None, api=False):
    if not domain_directory:
        domain_directory = "generated_rules"
    print(f"[+] Generating Taxonomy with at least {str(minimum_elements)} domains...")
    content = ""



    system_prompt = """
Genera una tassonomia dettagliata e ramificata di concetti STRETTAMENTE relativi al dominio fornito dall'utente. 
Rispondi SEMPRE in XML seguendo il seguente formato:
<DOMAINTREE>
    <DOMAIN NAME="concept id" DESCRIPTION="name of the concept">
        <DOMAIN NAME="concept id" DESCRIPTION="name of the concept" />
    </DOMAIN>
</DOMAINTREE>
    """

    user_prompt = f"""
Genera una tassonomia dettagliata e ramificata di concetti STRETTAMENTE relativi al dominio seguente: 
{domain.upper()}

### Altre indicazioni:
Rispondi SEMPRE in linguaggio XML seguendo il seguente formato:
<DOMAINTREE>
    <DOMAIN NAME="concept id" DESCRIPTION="name of the concept">
        <DOMAIN NAME="concept id" DESCRIPTION="name of the concept" />
    </DOMAIN>
</DOMAINTREE>
---
Fornisci almeno {str(minimum_elements)} elementi.
---
Usa la lingua ITALIANA."""
    print(user_prompt)


    while not content.endswith("</DOMAINTREE>"):
        completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        )

        content = completion.choices[0].message.content
        if content.strip().startswith("<DOMAINTREE>") and content.endswith("</DOMAINTREE>"):
            xml_head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            content = xml_head + content
            try:
                root = ET.fromstring(content)

                for domain in root.findall('.//DOMAIN'):
                    name_attribute = domain.get('NAME')
                    cleaned_name = clean_text(name_attribute)
                    domain.set('NAME', cleaned_name)

                    description_attribute = domain.get('DESCRIPTION')
                    if description_attribute is None:
                        print("[-] DESCRIPTION attribute not found for a DOMAIN element. Regenerating...")
                        content = ""
                        break

                content = ET.tostring(root, encoding="unicode")
                xml_head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                content = xml_head + content
                
                n_domains = len(root.findall('.//DOMAIN'))
                if n_domains >= int(minimum_elements):
                    save_tax(content, domain_directory)
                    print(f"[+] Generated taxonomy with {str(n_domains)} domains")
                    return content
                else:
                    if not api:
                        keep_it = input(f"[?] Generated taxonomy with {str(n_domains)} domains. Keep it or retry? k/r ").lower()
                        if keep_it == "k":
                            save_tax(content, domain_directory)
                            return content
                        elif keep_it == "r":
                            content = ""
                            print(f"[-] Taxonomy insufficient ({str(n_domains)} domains), if this keeps failing try reducing the minimum elements parameter. Retrying...")
                    else:
                        content = ""
                        print(f"[-] Taxonomy insufficient ({str(n_domains)} domains), if this keeps failing try reducing the minimum elements parameter. Retrying...")
            except ET.ParseError as e:
                content = ""
                print(e)
                print(f"[-] Unable to parse the taxonomy response.\n\nError:\n{e}\n\n Retrying...")
        else:
            print("[-] Taxonomy generation failed, if this keeps failing try reducing the minimum elements parameter. Retrying...")


# get_taxonomy("cloud services", minimum_elements=200)