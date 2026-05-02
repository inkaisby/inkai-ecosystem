import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class InkaiTheme {
  static const Color primaryGold = Color(0xFFF59E0B);
  static const Color backgroundDark = Color(0xFF0A0A0C);
  static const Color cardDark = Color(0xFF1E1E24);
  static const Color textLight = Color(0xFFEDEDED);

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: backgroundDark,
    primaryColor: primaryGold,
    colorScheme: ColorScheme.dark(
      primary: primaryGold,
      secondary: primaryGold.withOpacity(0.8),
      surface: cardDark,
    ),
    textTheme: GoogleFonts.interTextTheme(
      const TextTheme(
        headlineMedium: TextStyle(color: textLight, fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(color: textLight),
      ),
    ),
    cardTheme: CardThemeData(
      color: cardDark,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
    ),
  );
}
