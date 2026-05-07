import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/chat_models.dart';

class ChatService extends ChangeNotifier {
  IO.Socket? socket;
  // Use localhost for web/desktop, 10.0.2.2 for android emulator
  final String _baseUrl = 'http://127.0.0.1:5001'; 
  List<ChatMessage> _messages = [];
  List<ChatMessage> get messages => _messages;
  
  bool _isConnected = false;
  bool get isConnected => _isConnected;

  String? _currentUserId;

  void init(String userId) {
    _currentUserId = userId;
    _connectSocket();
  }

  void _connectSocket() async {
    if (socket != null && socket!.connected) return;

    socket = IO.io(_baseUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build());

    socket!.connect();

    socket!.onConnect((_) {
      debugPrint('Chat Socket connected');
      _isConnected = true;
      notifyListeners();
    });

    socket!.onDisconnect((_) {
      debugPrint('Chat Socket disconnected');
      _isConnected = false;
      notifyListeners();
    });

    socket!.on('receive_message', (data) {
      if (_currentUserId != null) {
        final message = ChatMessage.fromJson(data, _currentUserId!);
        _messages.add(message);
        notifyListeners();
      }
    });

    socket!.onConnectError((data) => debugPrint('Connect Error: $data'));
    socket!.onError((data) => debugPrint('Socket Error: $data'));
  }

  void joinConversation(String conversationId) {
    _messages = [];
    socket?.emit('join_room', conversationId);
  }

  void sendMessage(String conversationId, String content) {
    if (_currentUserId == null || socket == null) return;
    
    socket?.emit('send_message', {
      'conversationId': conversationId,
      'senderId': _currentUserId,
      'content': content,
    });
  }

  void setMessages(List<ChatMessage> msgs) {
    _messages = List.from(msgs);
    notifyListeners();
  }

  void clearMessages() {
    _messages = [];
    notifyListeners();
  }

  @override
  void dispose() {
    socket?.disconnect();
    socket?.dispose();
    super.dispose();
  }
}
