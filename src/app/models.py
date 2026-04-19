from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    birth_date = models.DateField(null=True, blank=True)
    # 他に必要なフィールドがあれば追加します


class FourPAnalysis(models.Model):
    overview = models.TextField(verbose_name="概要", blank=True)       # 追加例
    memo = models.TextField(verbose_name="プロジェクトメモ", blank=True)  # 追加例
    product = models.TextField(verbose_name="製品")
    price = models.TextField(verbose_name="価格")
    place = models.TextField(verbose_name="流通")
    promotion = models.TextField(verbose_name="販促")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日")

    def __str__(self):
        return f"4P分析 {self.id}"


class Project(models.Model):
    start_date = models.DateField()
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    members = models.ManyToManyField(User, related_name='participating_projects', blank=True)

    def __str__(self):
        return f"{self.start_date.year} - {self.name}"

class ChatRoom(models.Model):
    room_type = models.CharField(max_length=50)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    # チャットルームの名前や説明
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    members = models.ManyToManyField(User, related_name='chatrooms', blank=True)

    def __str__(self):
        return self.name

class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.message[:20]}"



class SWOTAnalysis(models.Model):
    """SWOT分析のメタ情報を管理"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='swot_analysis')
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class SWOTItem(models.Model):
    """SWOTの各要素（強み、弱み、機会、脅威）を個別管理"""
    CATEGORY_CHOICES = [
        ('Strength', 'Strength'),
        ('Weakness', 'Weakness'),
        ('Opportunity', 'Opportunity'),
        ('Threat', 'Threat'),
    ]
    
    analysis = models.ForeignKey(SWOTAnalysis, on_delete=models.CASCADE, related_name="items")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.content[:30]}..."

class CrossSWOT(models.Model):
    parent_swot = models.ForeignKey(SWOTAnalysis, on_delete=models.CASCADE, related_name='cross_swot')
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    # 必要なら、userも保存。通常は親のSWOTと同じであれば自動的に紐づく
    user = models.ForeignKey(User, on_delete=models.CASCADE)

class CrossSWOTItem(models.Model):
    QUADRANT_CHOICES = [
        ('SO', '強み×機会'),
        ('WO', '弱み×機会'),
        ('ST', '強み×脅威'),
        ('WT', '弱み×脅威'),
    ]
    cross_swot = models.ForeignKey(CrossSWOT, on_delete=models.CASCADE, related_name='items')
    quadrant = models.CharField(max_length=2,choices=QUADRANT_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class SwotHistory(models.Model):
    swot = models.ForeignKey(SWOTAnalysis, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    changed_at = models.DateTimeField(auto_now_add=True)
    change_summary = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"History of SWOT {self.swot.id} by {self.user.username} at {self.changed_at}"
