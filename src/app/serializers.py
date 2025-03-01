from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    SWOTAnalysis, 
    SWOTItem, 
    CrossSWOT, 
    CrossSWOTItem,
    Project,
    ChatMessage,
    )


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user


class SWOTItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SWOTItem
        fields = ['id', 'category', 'content', 'created_at']

class SWOTAnalysisSerializer(serializers.ModelSerializer):
    items = SWOTItemSerializer(many=True)
    
    class Meta:
        model = SWOTAnalysis
        fields = ['id', 'user', 'project', 'title', 'created_at', 'items']
        read_only_fields = ['id', 'created_at', 'user']

    def create(self, validated_data):
        # ネストしたitemsデータを分離
        items_data = validated_data.pop('items');
        analysis = SWOTAnalysis.objects.create(**validated_data)
        for item in items_data:
            SWOTItem.objects.create(analysis=analysis, **item)
        return analysis
    
    def update(self, instance, validated_data):
        # items の更新データを取り出す
        items_data = validated_data.pop('items', [])
        
        # SWOT 分析自体のフィールド更新（例：タイトルなど）
        instance.title = validated_data.get('title', instance.title)
        instance.save()

        # クライアントから送られてきたアイテムのID一覧を抽出
        sent_ids = [item_data.get('id') for item_data in items_data if item_data.get('id')]

        # 既存のアイテムを取得し、辞書にする（id をキーとして）
        item_mapping = {item.id: item for item in instance.items.all()}

        # 既存のうち、クライアントから送信されていないアイテムを削除する
        for item in instance.items.all():
            if item.id not in sent_ids:
                item.delete()

        # クライアントから送られてきた各アイテムデータについて更新または新規作成を行う
        for item_data in items_data:
            item_id = item_data.get('id', None)
            if item_id and item_id in item_mapping:
                # 既存アイテムの更新
                item_instance = item_mapping[item_id]
                for attr, value in item_data.items():
                    setattr(item_instance, attr, value)
                item_instance.save()
            else:
                # 新しいアイテムの作成
                instance.items.create(**item_data)

        return instance

    

class CrossSWOTItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrossSWOTItem
        fields = ['id', 'quadrant', 'content', 'created_at']
    
class CrossSWOTSerializer(serializers.ModelSerializer):
    items = CrossSWOTItemSerializer(many=True)

    class Meta:
        model = CrossSWOT
        fields = ['id', 'parent_swot', 'user', 'title', 'created_at', 'items']
        read_only_fields = ['id', 'created_at', 'user']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        cross_swot = CrossSWOT.objects.create(**validated_data)
        for item in items_data:
            CrossSWOTItem.objects.create(cross_swot=cross_swot, **item)
        return cross_swot

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProjectSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    swot_analysis = SWOTAnalysisSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'start_date', 'name', 'user', 'members', 'swot_analysis']
        read_only_fields = ['id', 'user']
    
    def create(self, validated_data):
        return Project.objects.create(user=self.context['request'].user, **validated_data)

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username')

    class Meta:
        model = ChatMessage
        fields = ['sender', 'message', 'timestamp']

"""以下学習用メモ
【CrossSWOTItemSerializer】
Metaクラス
model = 対応させるモデルの指定
シリアライズ時に含めるフィールドの指定
【CrossSWOTItemSerializer】
ネストされたシリアライゼーション
items = CrossSWOTItemSerializer(many=True)
CrossSWOTに関連する複数のCrossSWOTItemをネストして扱い、
1つのCrossSWOTインスタンスとその中に含まれる複数のアイテムを一括でシリアライズ/デシリアライズできる


"""
