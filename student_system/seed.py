import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'student_system.settings')
django.setup()

from studentapp.models import Student, Skill

print("Cleaning database...")
Student.objects.all().delete()
Skill.objects.all().delete()

print("Seeding sample students and skills...")
students_data = [
    {
        'name': 'Alex Rivera',
        'email': 'alex.rivera@university.edu',
        'department': 'Computer Science',
        'roll_number': 'CS-2026-0045',
        'skills': [
            {'name': 'React', 'proficiency': 'Advanced', 'years_of_experience': 2},
            {'name': 'Django', 'proficiency': 'Intermediate', 'years_of_experience': 1},
            {'name': 'Python', 'proficiency': 'Advanced', 'years_of_experience': 3},
        ]
    },
    {
        'name': 'Sophia Chen',
        'email': 'sophia.chen@university.edu',
        'department': 'Computer Science',
        'roll_number': 'CS-2026-0012',
        'skills': [
            {'name': 'Python', 'proficiency': 'Expert', 'years_of_experience': 4},
            {'name': 'Machine Learning', 'proficiency': 'Advanced', 'years_of_experience': 2},
            {'name': 'SQL', 'proficiency': 'Intermediate', 'years_of_experience': 2},
        ]
    },
    {
        'name': 'Marcus Vance',
        'email': 'marcus.vance@university.edu',
        'department': 'Electrical Engineering',
        'roll_number': 'EE-2026-0078',
        'skills': [
            {'name': 'Arduino', 'proficiency': 'Expert', 'years_of_experience': 3},
            {'name': 'C++', 'proficiency': 'Advanced', 'years_of_experience': 3},
            {'name': 'MATLAB', 'proficiency': 'Intermediate', 'years_of_experience': 1},
        ]
    },
    {
        'name': 'Emily Watson',
        'email': 'emily.watson@university.edu',
        'department': 'Data Science',
        'roll_number': 'DS-2026-0023',
        'skills': [
            {'name': 'SQL', 'proficiency': 'Advanced', 'years_of_experience': 2},
            {'name': 'Python', 'proficiency': 'Advanced', 'years_of_experience': 3},
            {'name': 'Tableau', 'proficiency': 'Intermediate', 'years_of_experience': 1},
        ]
    },
    {
        'name': 'Liam O\'Connor',
        'email': 'liam.oconnor@university.edu',
        'department': 'Mechanical Engineering',
        'roll_number': 'ME-2026-0105',
        'skills': [
            {'name': 'SolidWorks', 'proficiency': 'Advanced', 'years_of_experience': 2},
            {'name': 'AutoCAD', 'proficiency': 'Intermediate', 'years_of_experience': 2},
        ]
    }
]

for s_data in students_data:
    skills = s_data.pop('skills')
    student = Student.objects.create(**s_data)
    for sk in skills:
        Skill.objects.create(student=student, **sk)

print("Database seeded successfully with sample students and skills!")
