import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'http://127.0.0.1:5001/v1', 
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  Dio get dio => _dio;

  ApiService() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // DEBUG: Verify URL before request
          debugPrint('🚀 API Request: ${options.method} ${options.baseUrl}${options.path}');
          
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
      ),
    );
  }

  Future<Response> login(String identifier, String password) async {
    return await _dio.post('/auth/login', data: {
      'identifier': identifier,
      'password': password,
    });
  }

  Future<Response> register({
    required String email,
    required String password,
    required String fullName,
    required String dojoId,
    String? phoneNumber,
    bool isParent = false,
  }) async {
    final body = <String, dynamic>{
      'email': email,
      'password': password,
      'fullName': fullName,
      if (dojoId.isNotEmpty) 'dojoId': dojoId,
      if (phoneNumber != null && phoneNumber.isNotEmpty) 'phoneNumber': phoneNumber,
      if (isParent) 'isParent': true,
    };
    return await _dio.post('/auth/register', data: body);
  }

  Future<Response> getProvinces() async {
    return await _dio.get('/org/provinces');
  }

  Future<Response> getBranches(String provinceId) async {
    final path = (provinceId.isEmpty || provinceId == 'all') ? '/org/branches/all' : '/org/branches/$provinceId';
    return await _dio.get(path);
  }

  Future<Response> getDojos(String branchId) async {
    final path = (branchId.isEmpty || branchId == 'all') ? '/org/dojos/all' : '/org/dojos/$branchId';
    return await _dio.get(path);
  }

  Future<Response> getMembers({String? dojoId, String? search}) async {
    final Map<String, dynamic> params = {};
    if (dojoId != null) params['dojoId'] = dojoId;
    if (search != null) params['search'] = search;
    return await _dio.get('/members', queryParameters: params);
  }

  Future<Response> getProfile() async {
    return await _dio.get('/members/me');
  }

  Future<Response> syncAttendance(List<Map<String, dynamic>> logs) async {
    return await _dio.post('/attendance/sync', data: {'logs': logs});
  }

  Future<Response> getEvents() async {
    return await _dio.get('/events');
  }

  Future<Response> getMyEvents() async {
    return await _dio.get('/events/my/registrations');
  }

  Future<Response> getEventById(String id) async {
    return await _dio.get('/events/$id');
  }

  Future<Response> getMyBillings() async {
    return await _dio.get('/billing/my');
  }

  Future<Response> getProducts() async {
    return await _dio.get('/inventory');
  }

  Future<Response> getNotifications() async {
    return await _dio.get('/notifications/my');
  }

  Future<Response> searchDojos(String query) async {
    return await _dio.get('/org/dojos/search', queryParameters: {'q': query});
  }

  Future<Response> submitDojoTransfer({
    required String targetDojoId,
    required String reason,
  }) async {
    return await _dio.post('/verifications/claim', data: {
      'type': 'DOJO_TRANSFER',
      'data': targetDojoId,
      'proofUrl': 'PENDING_DOCUMENT', // Placeholder for now
    });
  }

  Future<Response> getConnectedProfiles() async {
    return await _dio.get('/members/me/children');
  }

  Future<Response> getDashboardStats() async {
    return await _dio.get('/dashboard/stats');
  }

  Future<Response> registerChild({
    required String fullName,
    required String dojoId,
    String? gender,
    String? birthDate,
  }) async {
    return await _dio.post('/members/me/children', data: {
      'fullName': fullName,
      'dojoId': dojoId,
      'gender': gender,
      'birthDate': birthDate,
    });
  }

  // Chat Endpoints
  Future<Response> getConversations() async {
    return await _dio.get('/chat/conversations');
  }

  Future<Response> getChatMessages(String conversationId) async {
    return await _dio.get('/chat/messages/$conversationId');
  }

  Future<Response> startConversation(String participantId) async {
    return await _dio.post('/chat/conversations', data: {
      'participantId': participantId,
    });
  }

  Future<Response> broadcastNotification({
    required String title,
    required String content,
    required String type,
  }) async {
    return await _dio.post('/notifications/broadcast', data: {
      'title': title,
      'content': content,
      'type': type,
    });
  }

  Future<Response> uploadDocument(String fieldName, String filePath) async {
    final formData = FormData.fromMap({
      'fieldName': fieldName,
      'document': await MultipartFile.fromFile(filePath),
    });
    return await _dio.post('/members/upload-document', data: formData);
  }

  Future<Response> changePassword(String oldPassword, String newPassword) async {
    return await _dio.put('/auth/change-password', data: {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
    });
  }

  Future<Response> uploadProfilePhoto(String filePath) async {
    final formData = FormData.fromMap({
      'photo': await MultipartFile.fromFile(filePath),
    });
    return await _dio.post('/auth/upload-photo', data: formData);
  }

  Future<Response> updateProfile(String fullName, String phoneNumber) async {
    return await _dio.patch('/members/me', data: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
    });
  }

  Future<Response> forgotPassword(String identifier) async {
    return await _dio.post('/auth/forgot-password', data: {
      'identifier': identifier,
    });
  }

  Future<Response> updateEvent(String id, Map<String, dynamic> data) async {
    return await _dio.put('/events/$id', data: data);
  }

  Future<Response> processPayment({required String billingId, required String paymentMethod}) async {
    return await _dio.post('/billing/pay', data: {
      'billingId': billingId,
      'paymentMethod': paymentMethod,
      'externalId': 'TRX-${DateTime.now().millisecondsSinceEpoch}',
    });
  }

  Future<Response> verifyPayment({required String billingId}) async {
    return await _dio.post('/billing/verify', data: {
      'billingId': billingId,
    });
  }

  Future<Response> deleteBilling(String id) async {
    return await _dio.delete('/billing/$id');
  }
}
