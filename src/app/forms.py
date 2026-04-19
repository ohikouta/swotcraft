from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import FourPAnalysis

class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True, help_text="必須です")

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

class FourPAnalysisForm(forms.ModelForm):
    class Meta:
        model = FourPAnalysis
        fields = ['overview', 'memo', 'product', 'price', 'place', 'promotion']
        # widgetsなどで見た目を調整することも可能です