"""
Run: python seed_assessments.py
Seeds sample assessments with questions for all 4 categories.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'student_system.settings')
django.setup()

from studentapp.models import Assessment, Question, Choice

def seed():
    data = [
        # ── APTITUDE ─────────────────────────────────────────────────────────
        {
            'title': 'Basic Aptitude Test',
            'description': 'Tests logical reasoning, numerical ability and verbal skills.',
            'category': 'aptitude', 'difficulty': 'medium', 'duration_minutes': 20,
            'questions': [
                {
                    'text': 'If 5 machines take 5 minutes to make 5 widgets, how long do 100 machines take to make 100 widgets?',
                    'type': 'mcq', 'marks': 2, 'order': 1,
                    'explanation': 'Each machine takes 5 minutes to make 1 widget. So 100 machines each make 1 widget in 5 minutes.',
                    'choices': [('1 minute', False), ('5 minutes', True), ('100 minutes', False), ('20 minutes', False)],
                },
                {
                    'text': 'Complete the series: 2, 6, 12, 20, 30, ?',
                    'type': 'mcq', 'marks': 2, 'order': 2,
                    'explanation': 'The differences are 4,6,8,10,12 — so next is 30+12=42.',
                    'choices': [('36', False), ('40', False), ('42', True), ('44', False)],
                },
                {
                    'text': 'A train travels 60 km in 1 hour. How far does it travel in 2.5 hours?',
                    'type': 'mcq', 'marks': 1, 'order': 3,
                    'explanation': 'Distance = Speed × Time = 60 × 2.5 = 150 km.',
                    'choices': [('120 km', False), ('150 km', True), ('180 km', False), ('100 km', False)],
                },
                {
                    'text': 'If APPLE is coded as BQQMF, how is MANGO coded?',
                    'type': 'mcq', 'marks': 2, 'order': 4,
                    'explanation': 'Each letter is shifted by 1 position forward in the alphabet.',
                    'choices': [('NBOHP', True), ('NBNGO', False), ('LZMFN', False), ('OCOIP', False)],
                },
                {
                    'text': 'Which number is next in the Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, ?',
                    'type': 'mcq', 'marks': 1, 'order': 5,
                    'explanation': 'Each number is the sum of the two before it: 8+13=21.',
                    'choices': [('18', False), ('20', False), ('21', True), ('24', False)],
                },
            ]
        },
        # ── TECHNICAL ────────────────────────────────────────────────────────
        {
            'title': 'Web Development Fundamentals',
            'description': 'Test your knowledge of HTML, CSS, JavaScript and basic web concepts.',
            'category': 'technical', 'difficulty': 'medium', 'duration_minutes': 25,
            'questions': [
                {
                    'text': 'Which HTML tag is used to define an internal style sheet?',
                    'type': 'mcq', 'marks': 1, 'order': 1,
                    'explanation': '<style> is used inside <head> to define CSS styles.',
                    'choices': [('<css>', False), ('<style>', True), ('<script>', False), ('<link>', False)],
                },
                {
                    'text': 'What does CSS stand for?',
                    'type': 'mcq', 'marks': 1, 'order': 2,
                    'explanation': 'CSS = Cascading Style Sheets.',
                    'choices': [('Creative Style Sheets', False), ('Cascading Style Sheets', True), ('Computer Style Sheets', False), ('Colorful Style Sheets', False)],
                },
                {
                    'text': 'Which JavaScript method is used to select an HTML element by its ID?',
                    'type': 'mcq', 'marks': 1, 'order': 3,
                    'explanation': 'document.getElementById() returns the element with the matching id attribute.',
                    'choices': [('document.querySelector()', False), ('document.getElement()', False), ('document.getElementById()', True), ('document.findById()', False)],
                },
                {
                    'text': 'What is the output of: console.log(typeof null) in JavaScript?',
                    'type': 'mcq', 'marks': 2, 'order': 4,
                    'explanation': 'typeof null returns "object" — this is a well-known JavaScript bug that was never fixed for backwards compatibility.',
                    'choices': [('null', False), ('"object"', True), ('"undefined"', False), ('"null"', False)],
                },
                {
                    'text': 'Which HTTP method is used to send data to a server to create/update a resource?',
                    'type': 'mcq', 'marks': 1, 'order': 5,
                    'explanation': 'POST is used to send data to create a resource. PUT updates it.',
                    'choices': [('GET', False), ('POST', True), ('DELETE', False), ('HEAD', False)],
                },
            ]
        },
        # ── COMMUNICATION ────────────────────────────────────────────────────
        {
            'title': 'English Communication Skills',
            'description': 'Assess your grammar, vocabulary and comprehension skills.',
            'category': 'communication', 'difficulty': 'easy', 'duration_minutes': 15,
            'questions': [
                {
                    'text': 'Choose the correct sentence:',
                    'type': 'mcq', 'marks': 1, 'order': 1,
                    'explanation': '"She doesn\'t know" is grammatically correct. "She don\'t know" is incorrect.',
                    'choices': [('She don\'t know the answer.', False), ('She doesn\'t know the answer.', True), ('She not know the answer.', False), ('She isn\'t know the answer.', False)],
                },
                {
                    'text': 'What is the synonym of "Eloquent"?',
                    'type': 'mcq', 'marks': 1, 'order': 2,
                    'explanation': 'Eloquent means fluent and persuasive in speaking or writing.',
                    'choices': [('Rude', False), ('Articulate', True), ('Silent', False), ('Confused', False)],
                },
                {
                    'text': 'Fill in the blank: "Neither the manager nor the employees __ present."',
                    'type': 'mcq', 'marks': 2, 'order': 3,
                    'explanation': 'When "neither...nor" is used, the verb agrees with the subject closest to it (employees = plural, so "were").',
                    'choices': [('was', False), ('were', True), ('is', False), ('are being', False)],
                },
                {
                    'text': 'Which of the following is an example of active voice?',
                    'type': 'mcq', 'marks': 1, 'order': 4,
                    'explanation': 'In active voice, the subject performs the action. "The dog bit the man" is active.',
                    'choices': [('The cake was eaten by Tom.', False), ('The letter was written by her.', False), ('The dog bit the man.', True), ('The homework was done by them.', False)],
                },
                {
                    'text': 'Identify the correctly punctuated sentence:',
                    'type': 'mcq', 'marks': 1, 'order': 5,
                    'explanation': 'A comma is needed after an introductory phrase like "However".',
                    'choices': [('However the results were surprising.', False), ('However, the results were surprising.', True), ('However; the results were surprising.', False), ('However: the results were surprising.', False)],
                },
            ]
        },
        # ── PERSONALITY ──────────────────────────────────────────────────────
        {
            'title': 'Career Personality Assessment',
            'description': 'Discover your work style, strengths and ideal career environment.',
            'category': 'personality', 'difficulty': 'easy', 'duration_minutes': 10,
            'questions': [
                {
                    'text': 'When working on a group project, I prefer to:',
                    'type': 'mcq', 'marks': 0, 'order': 1,
                    'explanation': 'There are no right or wrong answers — this reveals your collaboration style.',
                    'choices': [('Take the lead and assign tasks', False), ('Contribute ideas and support the leader', False), ('Focus on my individual part quietly', False), ('Ensure everyone communicates well', False)],
                },
                {
                    'text': 'When faced with a challenging problem, I usually:',
                    'type': 'mcq', 'marks': 0, 'order': 2,
                    'explanation': 'This reveals your problem-solving approach.',
                    'choices': [('Analyze it logically step by step', False), ('Ask others for their perspective first', False), ('Trust my intuition and experiment', False), ('Research thoroughly before acting', False)],
                },
                {
                    'text': 'I feel most motivated when:',
                    'type': 'mcq', 'marks': 0, 'order': 3,
                    'explanation': 'Motivational drivers vary by personality type.',
                    'choices': [('I achieve measurable results', False), ('I help someone succeed', False), ('I learn something new', False), ('I receive recognition for my work', False)],
                },
                {
                    'text': 'My ideal work environment is:',
                    'type': 'mcq', 'marks': 0, 'order': 4,
                    'explanation': 'Environment preferences reveal work style compatibility.',
                    'choices': [('Structured with clear processes', False), ('Collaborative and social', False), ('Independent with minimal meetings', False), ('Fast-paced and dynamic', False)],
                },
                {
                    'text': 'When receiving critical feedback, I:',
                    'type': 'mcq', 'marks': 0, 'order': 5,
                    'explanation': 'Feedback response is a key professional skill indicator.',
                    'choices': [('Welcome it as a growth opportunity', False), ('Need time to process before responding', False), ('Ask clarifying questions immediately', False), ('Feel motivated to prove myself', False)],
                },
            ]
        },
    ]

    created = 0
    for a in data:
        if Assessment.objects.filter(title=a['title']).exists():
            print(f"  [skip] Already exists: {a['title']}")
            continue
        assessment = Assessment.objects.create(
            title=a['title'], description=a['description'],
            category=a['category'], difficulty=a['difficulty'],
            duration_minutes=a['duration_minutes'], is_active=True,
        )
        for q in a['questions']:
            question = Question.objects.create(
                assessment=assessment, text=q['text'],
                question_type=q['type'], marks=q['marks'],
                order=q['order'], explanation=q.get('explanation', ''),
            )
            for i, (text, is_correct) in enumerate(q['choices']):
                Choice.objects.create(question=question, text=text, is_correct=is_correct, order=i)
        print(f"  [ok] Created: {assessment.title} ({len(a['questions'])} questions)")
        created += 1

    print(f"\nDone! Created {created} new assessments.")

if __name__ == '__main__':
    seed()
