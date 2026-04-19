from django.urls import re_path
from .consumers.chat import ChatConsumer
from .consumers.swot_collab import SwotCollabConsumer

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room_name>[^/]+)/$', ChatConsumer.as_asgi()),
    re_path(r'^ws/swot-collab/(?P<swot_id>[^/]+)/$', SwotCollabConsumer.as_asgi()),
]
