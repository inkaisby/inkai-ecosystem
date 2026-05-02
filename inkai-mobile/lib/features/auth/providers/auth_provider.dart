import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  String? _token;
  Map<String, dynamic>? _user;
  List<dynamic> _connectedProfiles = [];

  bool get isLoading => _isLoading;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  List<dynamic> get connectedProfiles => _connectedProfiles;
  bool get isAuthenticated => _token != null;

  AuthProvider() {
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    if (_token != null) {
      await _fetchProfile();
      await fetchConnectedProfiles();
    }
    notifyListeners();
  }

  Future<void> _fetchProfile() async {
    try {
      final response = await _apiService.getProfile();
      if (response.data['status'] == 'success') {
        _user = response.data['data'];
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Fetch Profile Error: $e');
      // If unauthorized, clear token
      if (e.toString().contains('401')) {
        logout();
      }
    }
  }

  Future<void> fetchConnectedProfiles() async {
    if (_user?['roles']?.contains('PARENT') ?? false) {
      try {
        final response = await _apiService.getConnectedProfiles();
        if (response.data['status'] == 'success') {
          _connectedProfiles = response.data['data'];
          notifyListeners();
        }
      } catch (e) {
        debugPrint('Fetch Connected Profiles Error: $e');
      }
    }
  }

  void switchProfile(Map<String, dynamic> targetProfile) {
    _user = targetProfile;
    notifyListeners();
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.login(identifier, password);
      if (response.data['status'] == 'success') {
        _token = response.data['token'];
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);

        await _fetchProfile();
        
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Login Error: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    notifyListeners();
  }
}
