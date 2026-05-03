import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../core/network/api_service.dart';
import 'chat_room_screen.dart';

class UserSearchScreen extends StatefulWidget {
  const UserSearchScreen({super.key});

  @override
  State<UserSearchScreen> createState() => _UserSearchScreenState();
}

class _UserSearchScreenState extends State<UserSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _users = [];
  bool _isLoading = false;

  void _searchUsers(String query) async {
    if (query.length < 2) return;

    setState(() => _isLoading = true);
    try {
      final apiService = ApiService();
      final response = await apiService.getMembers(search: query);
      if (response.data['status'] == 'success') {
        setState(() {
          _users = response.data['data'];
        });
      }
    } catch (e) {
      debugPrint('Error searching users: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _startChat(dynamic user) async {
    final String? userId = user['userId'];
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User ini belum memiliki akun mobile')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final apiService = ApiService();
      final response = await apiService.startConversation(userId);
      if (response.data['status'] == 'success') {
        final conversation = response.data['data'];
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => ChatRoomScreen(
                conversationId: conversation['id'],
                otherParticipantName: user['fullName'],
              ),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error starting conversation: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal memulai percakapan')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Cari nama atau NIA...',
            border: InputBorder.none,
          ),
          onChanged: _searchUsers,
        ),
      ),
      body: _isLoading && _users.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _users.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.search, size: 64, color: Colors.grey[300]),
                      const SizedBox(height: 16),
                      Text('Cari pengguna untuk memulai chat', style: TextStyle(color: Colors.grey[600])),
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: _users.length,
                  itemBuilder: (context, index) {
                    final user = _users[index];
                    return ListTile(
                      leading: CircleAvatar(
                        child: Text(user['fullName'].substring(0, 1).toUpperCase()),
                      ),
                      title: Text(user['fullName']),
                      subtitle: Text(user['nia'] ?? 'Belum ada NIA'),
                      onTap: () => _startChat(user),
                    );
                  },
                ),
    );
  }
}
