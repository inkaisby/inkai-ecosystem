class Conversation {
  final String id;
  final List<Participant> participants;
  final String? lastMessage;
  final DateTime updatedAt;

  Conversation({
    required this.id,
    required this.participants,
    this.lastMessage,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      participants: (json['participants'] as List)
          .map((p) => Participant.fromJson(p))
          .toList(),
      lastMessage: json['messages'] != null && (json['messages'] as List).isNotEmpty
          ? json['messages'][0]['content']
          : null,
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  String get otherParticipantName {
    // This is a simplified version, assuming 1v1 and we are one of them.
    // In a real app, you'd pass the current userId to filter.
    return participants.isNotEmpty ? participants[0].fullName : 'Unknown';
  }
}

class Participant {
  final String id;
  final String fullName;
  final String? email;

  Participant({
    required this.id,
    required this.fullName,
    this.email,
  });

  factory Participant.fromJson(Map<String, dynamic> json) {
    return Participant(
      id: json['id'],
      fullName: json['fullName'] ?? 'Unknown',
      email: json['email'],
    );
  }
}

class ChatMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String content;
  final DateTime createdAt;
  final bool isMe;

  ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.createdAt,
    this.isMe = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json, String currentUserId) {
    return ChatMessage(
      id: json['id'],
      conversationId: json['conversationId'],
      senderId: json['senderId'],
      senderName: json['sender']['fullName'],
      content: json['content'],
      createdAt: DateTime.parse(json['createdAt']),
      isMe: json['senderId'] == currentUserId,
    );
  }
}
