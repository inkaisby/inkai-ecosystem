import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_service.dart';
import '../../core/services/chat_service.dart';
import '../../models/chat_models.dart';

class ChatRoomScreen extends StatefulWidget {
  final String conversationId;
  final String otherParticipantName;

  const ChatRoomScreen({
    super.key,
    required this.conversationId,
    required this.otherParticipantName,
  });

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  void _initializeChat() async {
    final prefs = await SharedPreferences.getInstance();
    // In a real app, you'd get the current user ID from a UserProvider
    // For now, we'll try to fetch it from the profile or local storage
    final apiService = ApiService();
    final profileResponse = await apiService.getProfile();
    final String currentUserId = profileResponse.data['data']['userId'] ?? '';

    if (mounted) {
      final chatService = Provider.of<ChatService>(context, listen: false);
      chatService.init(currentUserId);
      chatService.joinConversation(widget.conversationId);
      
      // Load history
      try {
        final historyResponse = await apiService.getChatMessages(widget.conversationId);
        if (historyResponse.data['status'] == 'success') {
          final List data = historyResponse.data['data'];
          final List<ChatMessage> history = data
              .map((json) => ChatMessage.fromJson(json, currentUserId))
              .toList();
          chatService.setMessages(history);
        }
      } catch (e) {
        debugPrint('Error loading chat history: $e');
      }

      setState(() => _isLoading = false);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleSend() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    final chatService = Provider.of<ChatService>(context, listen: false);
    chatService.sendMessage(widget.conversationId, content);
    _messageController.clear();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.otherParticipantName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const Text('Online', style: TextStyle(fontSize: 12, color: Colors.green)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : Consumer<ChatService>(
                    builder: (context, chatService, child) {
                      _scrollToBottom();
                      return ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: chatService.messages.length,
                        itemBuilder: (context, index) {
                          final message = chatService.messages[index];
                          return _buildMessageBubble(message);
                        },
                      );
                    },
                  ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final isMe = message.isMe;
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8, left: 8, right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? Theme.of(context).primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: TextStyle(color: isMe ? Colors.white : Colors.black87),
            ),
            const SizedBox(height: 4),
            Text(
              '${message.createdAt.hour}:${message.createdAt.minute.toString().padLeft(2, '0')}',
              style: TextStyle(
                fontSize: 10,
                color: isMe ? Colors.white70 : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, -2),
            blurRadius: 5,
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(LucideIcons.plus, color: Colors.grey),
              onPressed: () {},
            ),
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Ketik pesan...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  fillColor: Colors.grey[100],
                  filled: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _handleSend(),
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: Theme.of(context).primaryColor,
              shape: const CircleBorder(),
              child: IconButton(
                icon: const Icon(LucideIcons.send, color: Colors.white),
                onPressed: _handleSend,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
