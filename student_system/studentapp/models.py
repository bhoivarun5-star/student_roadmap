from django.db import models


class Student(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
    roll_number = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"{self.name} ({self.roll_number})"


class Skill(models.Model):
    PROFICIENCY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Expert', 'Expert'),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES)
    years_of_experience = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.name} - {self.proficiency} ({self.student.name})"


# ─── Assessment Models ────────────────────────────────────────────────────────

class Assessment(models.Model):
    CATEGORY_CHOICES = [
        ('aptitude',      'Aptitude Test'),
        ('technical',     'Technical Skill Test'),
        ('communication', 'Communication Assessment'),
        ('personality',   'Personality Assessment'),
    ]
    DIFFICULTY_CHOICES = [
        ('easy',   'Easy'),
        ('medium', 'Medium'),
        ('hard',   'Hard'),
    ]

    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category    = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    difficulty  = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    duration_minutes = models.PositiveIntegerField(default=30, help_text="Time limit in minutes")
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"

    @property
    def question_count(self):
        return self.questions.count()


class Question(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('mcq',   'Multiple Choice'),
        ('multi', 'Multi Select'),
        ('text',  'Short Answer'),
    ]
    assessment    = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    text          = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPE_CHOICES, default='mcq')
    marks         = models.PositiveIntegerField(default=1)
    order         = models.PositiveIntegerField(default=0)
    explanation   = models.TextField(blank=True, help_text="Explanation shown after answering")

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Q{self.order}: {self.text[:60]}"


class Choice(models.Model):
    question   = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text       = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order      = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{'✓' if self.is_correct else '✗'} {self.text[:50]}"


class UserAttempt(models.Model):
    supabase_user_id = models.CharField(max_length=100, db_index=True)
    assessment       = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='attempts')
    score            = models.FloatField(null=True, blank=True)
    total_marks      = models.PositiveIntegerField(default=0)
    percentage       = models.FloatField(null=True, blank=True)
    completed        = models.BooleanField(default=False)
    started_at       = models.DateTimeField(auto_now_add=True)
    completed_at     = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Attempt by {self.supabase_user_id} on {self.assessment.title}"


class UserAnswer(models.Model):
    attempt        = models.ForeignKey(UserAttempt, on_delete=models.CASCADE, related_name='answers')
    question       = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, null=True, blank=True)
    text_answer    = models.TextField(blank=True)
    is_correct     = models.BooleanField(null=True, blank=True)

    def __str__(self):
        return f"Answer to Q{self.question.order}"
