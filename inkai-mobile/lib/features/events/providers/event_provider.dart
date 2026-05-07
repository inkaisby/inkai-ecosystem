import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';

class EventProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<dynamic> _events = [];
  bool _isLoading = false;
  String? _error;

  List<dynamic> get events => _events;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchEvents() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.getEvents();
      if (response.data['status'] == 'success') {
        _events = response.data['data'];
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Fetch Events Error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }
}
