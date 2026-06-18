import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colores_app.dart';

/// Tipografía de la app basada en la familia Inter (igual que el mockup).
abstract final class TipografiaApp {
  static TextTheme construirTextTheme() {
    final TextTheme base = GoogleFonts.interTextTheme();
    return base.copyWith(
      displayLarge: _estilo(32, FontWeight.w800, ColoresApp.textoPrincipal),
      displayMedium: _estilo(26, FontWeight.w800, ColoresApp.textoPrincipal),
      headlineMedium: _estilo(25, FontWeight.w800, ColoresApp.textoPrincipal),
      titleLarge: _estilo(19, FontWeight.w700, ColoresApp.textoPrincipal),
      titleMedium: _estilo(16, FontWeight.w700, ColoresApp.textoPrincipal),
      bodyLarge: _estilo(16, FontWeight.w500, ColoresApp.textoPrincipal),
      bodyMedium: _estilo(14, FontWeight.w500, ColoresApp.textoSecundario),
      bodySmall: _estilo(12.5, FontWeight.w500, ColoresApp.textoTenue),
      labelLarge: _estilo(15, FontWeight.w700, ColoresApp.superficie),
      labelMedium: _estilo(13, FontWeight.w600, ColoresApp.textoSecundario),
    );
  }

  static TextStyle _estilo(double tamano, FontWeight peso, Color color) {
    return GoogleFonts.inter(fontSize: tamano, fontWeight: peso, color: color);
  }
}
