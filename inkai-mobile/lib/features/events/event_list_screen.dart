import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'event_detail_screen.dart';
import '../../../core/network/api_service.dart';
import 'package:intl/intl.dart';

import '../../../core/theme.dart';

class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});

  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _events = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    try {
      final response = await _apiService.getEvents(); // Note: need to add this to ApiService
      setState(() {
        _events = response.data['data'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda Kegiatan'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold))
          : _error != null
              ? Center(child: Text('Error: $_error'))
              : _events.isEmpty
                  ? const Center(child: Text('Belum ada event terdekat.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(24),
                      itemCount: _events.length,
                      itemBuilder: (context, index) {
                        final event = _events[index];
                        return InkWell(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => EventDetailScreen(event: event),
                            ),
                          ),
                          child: _buildEventCard(event),
                        );
                      },

                    ),
    );
  }

  Widget _buildEventCard(dynamic event) {
    final bool isUKTEvent = event['title'].toString().toUpperCase().contains('UKT') || 
                            event['title'].toString().toUpperCase().contains('UJIAN');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: (isUKTEvent ? Colors.blue : InkaiTheme.primaryGold).withOpacity(0.1),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Icon(
              isUKTEvent ? LucideIcons.award : LucideIcons.trophy, 
              color: isUKTEvent ? Colors.blue : InkaiTheme.primaryGold
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event['title'] ?? 'Judul Event',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  '${event['location'] ?? 'Lokasi'} • ${DateFormat('dd-MM-yyyy').format(DateTime.parse(event['startDate']))}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          const Icon(LucideIcons.chevron_right, color: Colors.grey),
        ],
      ),
    );
  }
}

