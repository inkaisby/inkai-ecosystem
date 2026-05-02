import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';

class DojoSearchScreen extends StatefulWidget {
  const DojoSearchScreen({super.key});

  @override
  State<DojoSearchScreen> createState() => _DojoSearchScreenState();
}

class _DojoSearchScreenState extends State<DojoSearchScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _dojos = [];
  bool _isLoading = false;
  final _searchController = TextEditingController();

  Future<void> _searchDojos(String query) async {
    if (query.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      // Need to add searchDojos to ApiService or use existing getDojos with params
      final response = await _apiService.searchDojos(query);
      setState(() {
        _dojos = response.data['data'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cari Dojo'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: TextField(
              controller: _searchController,
              onSubmitted: _searchDojos,
              decoration: InputDecoration(
                hintText: 'Cari nama dojo atau kota...',
                prefixIcon: const Icon(LucideIcons.search, size: 20),
                suffixIcon: IconButton(
                  icon: const Icon(LucideIcons.arrow_right, size: 20),
                  onPressed: () => _searchDojos(_searchController.text),
                ),
                filled: true,
                fillColor: Colors.white.withOpacity(0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold))
                : _dojos.isEmpty
                    ? const Center(child: Text('Gunakan fitur pencarian di atas.'))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        itemCount: _dojos.length,
                        itemBuilder: (context, index) {
                          final dojo = _dojos[index];
                          return _buildDojoCard(dojo);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildDojoCard(dynamic dojo) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.house, color: InkaiTheme.primaryGold),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(dojo['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(
                  dojo['address'] ?? 'Alamat tidak tersedia',
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Icon(LucideIcons.chevron_right, color: Colors.grey, size: 16),
        ],
      ),
    );
  }
}

