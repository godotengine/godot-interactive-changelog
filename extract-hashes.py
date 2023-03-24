import os
import urllib.request
import urllib.error
import re

url = 'https://downloads.tuxfamily.org/godotengine/'

with urllib.request.urlopen(url) as response:
    html = response.read().decode()

pattern = re.compile(r'<a href="(\d\.\d(\.\d(\.\d)?)?/)">')
matches = pattern.findall(html)

version_names = []
for match in matches:
    subfolder_name = match[0]
    if subfolder_name.endswith('/'):
        version_names.append(subfolder_name[:-1])

# Create output directory if it doesn't exist
if not os.path.exists("./temp/configs"):
    os.makedirs("./temp/configs")

for version_name in version_names:
    output_path = f"./temp/configs/godotengine.godot.{version_name}.json"
    with open(output_path, 'w') as f:
        version_bits = version_name.split(".")
        last_bit = int(version_bits.pop())

        if last_bit == 0:
            last_bit = int(version_bits.pop())
            last_bit -= 1
            version_bits.append(str(last_bit))
        elif last_bit > 0:
            last_bit -= 1
            if last_bit > 0:
                version_bits.append(str(last_bit))

        if len(version_bits) == 1:
            version_bits.append("0")

        previous_version = ".".join(version_bits)

        f.write(
            f'{{\n'
            f'    "name": "{version_name}",\n'
            f'    "ref": "{version_name}-stable",\n'
            f'    "from_ref": "{previous_version}-stable",\n'
            f'    "article": "",\n'
            f'\n'
            f'    "releases": [\n'
        )

        version_url = url + version_name
        with urllib.request.urlopen(version_url) as response:
            subfolder_html = response.read().decode()

        subfolder_pattern = re.compile(r'<a href="([^"]+/)">')
        subfolder_matches = subfolder_pattern.findall(subfolder_html)

        folder_names = [match[:-1] for match in subfolder_matches if match not in ['mono/', '../']]
        for folder_name in folder_names:
            readme_url = f"{version_url}/{folder_name}/README.txt"
            commit_hash = "";
            try:
                with urllib.request.urlopen(readme_url) as response:
                    readme_text = response.read().decode()
                    commit_pattern = re.compile(r'Built from commit ([a-f0-9]+)')
                    commit_match = commit_pattern.search(readme_text)

                    if commit_match:
                        commit_hash = commit_match.group(1)
            except urllib.error.HTTPError:
                pass

            f.write(
                f'        {{\n'
                f'            "name": "{folder_name}",\n'
                f'            "ref": "{commit_hash}",\n'
                f'            "from_ref": "",\n'
                f'            "article": ""\n'
                f'        }},\n'
            )

        # Add the stable release, always
        f.write(
            f'        {{\n'
            f'            "name": "stable",\n'
            f'            "ref": "{version_name}-stable",\n'
            f'            "from_ref": "",\n'
            f'            "article": ""\n'
            f'        }}\n'
        )

        f.write(
            f'    ]\n'
            f'}}\n'
        )

        print(f"Written config '{output_path}'")
