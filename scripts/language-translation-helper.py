## This script helps me to find out which messages should be translated. `en.json5` to `cs.json5`
## I know this script is really ugly - it's only for internal purposes, but it could help you.
import csv
import json5

# txt_file_lines = ['{']
txt_file_lines = []
json_file_lines = []
missing = []

# with open("preklady-preložené-komplet.csv", encoding="utf8") as csvfile:
#     csvreader = csv.reader(csvfile, delimiter=";")
#
#     for name, en, cs in csvreader:
#         if name == '﻿id':
#             continue
#         line1 = '\n'
#         line2 = '  // \"' + name.strip() + '\"' + ' : ' + "\"" + en.strip() + "\"" + "\n"
#         line3 = '  \"' + name.strip() + '\"' + ' : ' + "\"" + cs.strip() + "\"" + ","
#         txt_file_lines.append(line1 + line2 + line3)
# txt_file_lines.append('}')

with open("preklady-preložené-komplet.csv", encoding="utf8") as csvfile:
    csvreader = csv.reader(csvfile, delimiter=";")

    for name, en, cs in csvreader:
        if name == '﻿id':
            continue
        txt_file_lines.append(name)

with open('cs.json5', encoding="utf8") as f:
    json_p = json5.load(f)
#     print(json_p)
    for name in json_p:
        txt_file_lines.append(name)

# json_file_values = []
with open('en.json5', encoding="utf8") as f:
    json_p = json5.load(f)
    for name in json_p:
        json_file_lines.append(name)
        # json_file_values.append(json_p[name])

# with open('cs.json5', encoding="utf8") as f:
#   json_p = json5.load(f)
#   for name in json_p:
#     line1 = '\n'
#     line2 = '  //'
#     if name in json_file_lines:
#       line2 += ' \"' + str(name).strip() + '\"' + ' : ' + "\"" + str(json_file_values[json_file_lines.index(name)]).strip() + "\"" + "\n"
#     line3 = '  \"' +  str(name).strip() + '\"' + ' : ' + "\"" + str(json_p[name]).strip() + "\"" + ","
#     txt_file_lines.append(line1 + line2 + line3)
#
# txt_file_lines.append('}')


print('en7.5: ' + str(len(json_file_lines)))
print('cs7.5: ' + str(len(txt_file_lines)))
#
for name in json_file_lines:
    if name not in txt_file_lines:
      print('Are not in the en: ' + name)
        # missing.append(name)
#

# create json with translation which must be added into czech translation\
# translate = ['{']
# with open("en.json5", encoding="utf8") as f:
#     json_p = json5.load(f)
#     for name in json_p:
#         if name not in missing:
#             continue
#         translate.append("\"" + name + "\"" + " : " + "\"" + json_p[name] + "\"" + "\n")
#
# translate.append('}')
#
# with open('translated_cs_7.2.txt', 'w', encoding='utf-8') as f:
#     f.write('\n'.join(txt_file_lines))
#
# with open('missing_cs_7.5.txt', 'w', encoding='utf-8') as f:
#     f.write('\n'.join(missing))

# with open('en_7.2.txt', 'w', encoding='utf-8') as f:
#     f.write('\n'.join(json_file_lines))

# with open('translated_cs_7.5_json.txt', 'w', encoding='utf-8') as f:
#     f.write('\n'.join(txt_file_lines))
#
# with open('cs_7.5._to_translate_json.txt', 'w', encoding='utf-8') as f:
#     f.write('\n'.join(translate))
