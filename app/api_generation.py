from flask import Flask, jsonify, request
from flask_cors import CORS
from RuleGenerator import RuleGenerator
import gpt
from pathlib import Path


app = Flask(__name__)
CORS(app)
rule_generator = RuleGenerator()


@app.route('/get_available_domains', methods=['GET'])
def get_available_domains():
    available_domains = [{"value": f.name.lower(), "label": f.name.capitalize()} for f in Path("generated_rules").glob("*")]
    try:
        return jsonify({'available_domains': available_domains}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/generate_rules', methods=['POST'])
def generate_rules():
    # body = {
    #     "general_domain": "servizi cloud",
    #     "minimum_tax_elements": 5,
    #     "distance_operator": 8,
    # }

    try:
        request_data = request.get_json()
        general_domain = request_data.get('general_domain')
        minimum_tax_elements = request_data.get('minimum_tax_elements', 5)
        distance_operator = request_data.get("distance_operator")

        rule_generator.distance_operator = distance_operator
        rule_generator.general_domain = general_domain
        rule_generator.domain_directory = rule_generator.rules_out_path.joinpath(general_domain)
        rule_generator.domain_directory.mkdir(exist_ok=True)
        rule_generator.clean_domain_directory()

        rule_generator.refresh_cpkrules_directory()
        rule_generator.cpkrules_domain_directory = rule_generator.cpkrules_directory / general_domain
        rule_generator.cpkrules_domain_directory.mkdir(exist_ok=True)

        rule_generator.kill_runner()
        rule_generator.start_runner(mode="generation")

        taxonomy_str = gpt.get_taxonomy(general_domain, minimum_elements=minimum_tax_elements, domain_directory=rule_generator.domain_directory)
        rule_generator.domains = rule_generator.get_all_domains(taxonomy_str)

        rule_generator.generate_rule_files_per_domain()
        rule_generator.copy_rules_to_cpkrules_domain_directory()
        rule_generator.write_imports()

        rule_generator.kill_runner()  # kill basic cpk to start again with the newly generated rules

        return jsonify({'message': 'Rules generated successfully.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_text', methods=['POST'])
def analyze_text():
    # body = {
    #     "selected_domain": "domain",
    #     "text_input": "text"
    # }

    try:
        request_data = request.get_json()
        selected_domain = request_data.get('selected_domain')
        text_input = request_data.get('text_input')
        
        analysis = rule_generator.get_categories(text_input)
        rule_generator.kill_runner()

        return jsonify({'analysis': analysis, 'selected_domain': selected_domain}), 200
    except Exception as e:
        print(f"'error': str({e})")
        return jsonify({'error': str(e)}), 500
    

@app.route('/switch_cartridge', methods=['POST'])
def switch_cartridge():
    try:
        request_data = request.get_json()
        selected_domain = request_data.get('selected_domain')
        if selected_domain:
            selected_domain = selected_domain.lower()

        rule_generator.switch_cartridge(selected_domain)
        
        rule_generator.kill_runner()

        rule_generator.start_runner(mode="analysis")

        print("[+] Cartridge switched successfully.")
        return jsonify({'message': 'Cartridge switched successfully.'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500
    

@app.route('/get_current_cartridge', methods=['GET'])
def get_current_cartridge():
    try:
        rules_subfolders = [subdir for subdir in rule_generator.cpkrules_directory.iterdir() if subdir.is_dir() and subdir.name != "dic"]
        cartridge = rules_subfolders[0]
        cartridge_name = cartridge.name

        return jsonify({'cartridge_name': cartridge_name}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500


@app.route('/get_rules', methods=['POST'])
def get_rules():
    data = request.json
    selected_domain = data.get("selectedDomain")
    selected_category = data.get('selectedCategory')
    rule_labels = data.get('ruleLabels')

    file_name = rule_generator.cpkrules_directory / selected_domain / f"auto_{selected_category}.cr"

    rules = []

    try:
        with open(file_name, 'r') as file:
            rule_lines = file.readlines()

            # Flag to determine if the current rule is required
            required_rule = False
            current_rule = []

            for line in rule_lines:
                # Check if the current line contains the start of a rule
                if any(label in line for label in rule_labels):
                    required_rule = True
                    current_rule.append(line)

                # If the current line contains the end of the rule or the file ends
                elif required_rule and "}" in line:
                    current_rule.append(line)
                    required_rule = False
                    rules.append('\n'.join(current_rule))
                    current_rule = []

                # If the current line is part of the required rule
                elif required_rule:
                    current_rule.append(line)

        return jsonify({'rules': rules}), 200

    except FileNotFoundError:
        return jsonify({'error': f'File {file_name} not found'}), 404


if __name__ == "__main__":
    app.run(debug=True)
