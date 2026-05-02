import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'https://inkai-ecosystem.vercel.app/v1', 
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  Dio get dio => _dio;

  ApiService() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
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
  }) async {
    return await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'fullName': fullName,
      'dojoId': dojoId,
      'phoneNumber': phoneNumber,
    });
  }

  Future<Response> getProvinces() async {
    return await _dio.get('/org/provinces');
  }

  Future<Response> getBranches(String provinceId) async {
    return await _dio.get('/org/branches/$provinceId');
  }

  Future<Response> getDojos(String branchId) async {
    return await _dio.get('/org/dojos/$branchId');
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
}





