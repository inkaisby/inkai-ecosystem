import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../core/network/api_service.dart';
import '../../models/chat_models.dart';
import 'chat_room_screen.dart';
import 'user_search_screen.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  late Future<List<Conversation>> _conversationsFuture;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  void _loadConversations() {
    setState(() {
      _conversationsFuture = _fetchConversations();
    });
  }

  Future<List<Conversation>> _fetchConversations() async {
    final apiService = ApiService();
    final response = await apiService.getConversations();
    if (response.data['status'] == 'success') {
      final List data = response.data['data'];
      return data.map((json) => Conversation.fromJson(json)).toList();
    }
    throw Exception('Failed to load conversations');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pesan', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.user_plus),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const UserSearchScreen()),
              );
              if (result == true) _loadConversations();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadConversations(),
        child: FutureBuilder<List<Conversation>>(
          future: _conversationsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.message_square, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text('Belum ada percakapan', style: TextStyle(color: Colors.grey[600])),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const UserSearchScreen()),
                      ),
                      child: const Text('Mulai Chat'),
                    ),
                  ],
                ),
              );
            }

            final conversations = snapshot.data!;
            return ListView.separated(
              itemCount: conversations.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final conversation = conversations[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                    child: Text(
                      conversation.otherParticipantName.substring(0, 1).toUpperCase(),
                      style: TextStyle(color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(conversation.otherParticipantName, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(
                    conversation.lastMessage ?? 'Belum ada pesan',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Text(
                    _formatDate(conversation.updatedAt),
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ChatRoomScreen(
                          conversationId: conversation.id,
                          otherParticipantName: conversation.otherParticipantName,
                        ),
                      ),
                    ).then((_) => _loadConversations());
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (date.day == now.day && date.month == now.month && date.year == now.year) {
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    }
    return '${date.day}/${date.month}';
  }
}
