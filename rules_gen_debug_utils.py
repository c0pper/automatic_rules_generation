from pathlib import Path
import re
from tqdm import tqdm

rules_folder = "generated_rules"
generated_files = Path(rules_folder).glob("*")
pattern = r'//\s*(.*?)\n(?!\s+})'


def get_file_sentences(file):
    with open(file, "r", encoding="UTF8") as f:
        content = f.read()
        sentences = re.findall(pattern, content)

    return sentences


def correct_comments(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    with open(file_path, 'w') as file:
        for line in lines:
            if line.startswith('//'):
                if " - " in line:
                    parts = line.split(" - ")
                    for p in parts:
                        file.write(f'// {p.replace("//", "").strip()}\n')
                else:
                    file.write(line)
            else:
                file.write(line)


def replace_list_blist():
    for f in Path("generated_rules").glob("*"):
        print(f"[+] {f.name}")
        with open(f, 'r', encoding="utf8") as file:
            lines = file.readlines()

        with open(f, 'w', encoding="utf8") as file:
            for line in lines:
                if "LIST" in line:
                    new_line = line.replace("LIST", "BLIST")
                    file.write(new_line)
                else:
                    file.write(line)



def main():
    report = ""
    for f in tqdm(list(generated_files)):
        sentences = get_file_sentences(f)
        for s in sentences:
            if " - " in s:
                issue = f"\n{f.name} - {s}"
                print(issue)
                report += issue
                correct = input("Correct file? y/n")
                if correct == "y":
                    correct_comments(f)

    with open("files_with_extra_long_sentences.txt", "w", encoding="utf8") as txt:
        txt.write(report)


if __name__ == "__main__":
    replace_list_blist()
    # main()