import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';

class StoreScreen extends StatefulWidget {
  const StoreScreen({super.key});

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _products = [];
  List<dynamic> _filteredProducts = [];
  bool _isLoading = true;
  String? _error;
  String _selectedCategory = 'Semua';

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      final response = await _apiService.getProducts();
      setState(() {
        _products = response.data['data'];
        _filteredProducts = _products;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _filterProducts(String category) {
    setState(() {
      _selectedCategory = category;
      if (category == 'Semua') {
        _filteredProducts = _products;
      } else {
        _filteredProducts = _products.where((p) => p['category'] == category.toUpperCase()).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text('INKAI STORE', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(LucideIcons.shopping_cart, size: 20),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold))
          : _error != null
              ? Center(child: Text('Error: $_error'))
              : Column(
                  children: [
                    _buildCategoryFilter(),
                    const SizedBox(height: 16),
                    Expanded(
                      child: _filteredProducts.isEmpty
                          ? Center(child: Text('Produk tidak ditemukan', style: GoogleFonts.inter(color: Colors.grey)))
                          : GridView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.65,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                              ),
                              itemCount: _filteredProducts.length,
                              itemBuilder: (context, index) {
                                return _buildProductCard(_filteredProducts[index], currencyFormat);
                              },
                            ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildCategoryFilter() {
    final categories = ['Semua', 'Seragam', 'Sabuk', 'Protektor', 'Merchandise'];
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final isSelected = categories[index] == _selectedCategory;
          return Container(
            margin: const EdgeInsets.only(right: 12),
            child: ChoiceChip(
              label: Text(categories[index]),
              selected: isSelected,
              onSelected: (val) => _filterProducts(categories[index]),
              backgroundColor: Colors.white.withOpacity(0.05),
              selectedColor: InkaiTheme.primaryGold,
              labelStyle: GoogleFonts.inter(
                color: isSelected ? Colors.black : Colors.grey,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              side: BorderSide.none,
              showCheckmark: false,
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductCard(dynamic product, NumberFormat formatter) {
    // Get real images based on product type
    String imageUrl = 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=300&auto=format&fit=crop';
    if (product['category'] == 'SABUK') {
      imageUrl = 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?q=80&w=300&auto=format&fit=crop';
    } else if (product['category'] == 'SERAGAM') {
      imageUrl = 'https://images.unsplash.com/photo-1517438476312-10d79c67750d?q=80&w=300&auto=format&fit=crop';
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: Colors.white10),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(color: Colors.black.withOpacity(0.5), shape: BoxShape.circle),
                      child: const Icon(LucideIcons.heart, size: 14, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product['category'] ?? 'INKAI',
                  style: GoogleFonts.inter(fontSize: 10, color: InkaiTheme.primaryGold, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  product['name'] ?? 'Produk',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                ),
                const SizedBox(height: 8),
                Text(
                  formatter.format(double.parse(product['price'].toString())),
                  style: GoogleFonts.jetBrainsMono(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Stok: ${product['stock']}', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
                    InkWell(
                      onTap: () {},
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: InkaiTheme.primaryGold, borderRadius: BorderRadius.circular(10)),
                        child: const Icon(LucideIcons.plus, size: 16, color: Colors.black),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


