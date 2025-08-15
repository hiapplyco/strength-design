import csv
import json
import re

def transform_exercises(csv_path, json_path):
    exercises = {}
    html_tag_re = re.compile('<.*?>')

    with open(csv_path, mode='r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            exercise_id = row['id']
            if exercise_id not in exercises:
                exercises[exercise_id] = {
                    'id': exercise_id,
                    'name': row['name_en'],
                    'video_url': row['full_video_url'],
                    'images': [row['full_video_image_url']] if row['full_video_image_url'] else [],
                    'instructions': re.sub(html_tag_re, '', row['description_en']).strip().split('\n'),
                    'primary_muscles': [],
                    'secondary_muscles': [],
                    'equipment': [],
                    'type': [],
                    'mechanics_type': []
                }

            attribute_name = row['attribute_name'].lower()
            attribute_value = row['attribute_value']

            if attribute_name == 'primary_muscle':
                if attribute_value not in exercises[exercise_id]['primary_muscles']:
                    exercises[exercise_id]['primary_muscles'].append(attribute_value)
            elif attribute_name == 'secondary_muscle':
                if attribute_value not in exercises[exercise_id]['secondary_muscles']:
                    exercises[exercise_id]['secondary_muscles'].append(attribute_value)
            elif attribute_name == 'equipment':
                if attribute_value not in exercises[exercise_id]['equipment']:
                    exercises[exercise_id]['equipment'].append(attribute_value)
            elif attribute_name == 'type':
                if attribute_value not in exercises[exercise_id]['type']:
                    exercises[exercise_id]['type'].append(attribute_value)
            elif attribute_name == 'mechanics_type':
                if attribute_value not in exercises[exercise_id]['mechanics_type']:
                    exercises[exercise_id]['mechanics_type'].append(attribute_value)


    with open(json_path, 'w', encoding='utf-8') as json_file:
        json.dump(list(exercises.values()), json_file, indent=2)

if __name__ == '__main__':
    transform_exercises('workout-cool/data/sample-exercises.csv', 'public/exercises.json')
    print("Transformation complete. `public/exercises.json` created.")
