import 'package:flutter/material.dart';
import '../constantes/constantes_app.dart';
import 'colores_app.dart';
import 'tipografia_app.dart';

/// Construye el [ThemeData] global de SIGO-OLLAS a partir de la paleta y la
/// tipografía del mockup. Modo claro como principal.
abstract final class TemaApp {
  static ThemeData construirTemaClaro() {
    final ColorScheme esquema = ColorScheme.fromSeed(
      seedColor: ColoresApp.primario,
      primary: ColoresApp.primario,
      secondary: ColoresApp.verdeMedio,
      surface: ColoresApp.superficie,
      error: ColoresApp.criticoPunto,
      brightness: Brightness.light,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: esquema,
      scaffoldBackgroundColor: ColoresApp.fondo,
      textTheme: TipografiaApp.construirTextTheme(),
      filledButtonTheme: _temaBotonPrincipal(),
      inputDecorationTheme: _temaInput(),
      splashColor: ColoresApp.primario.withValues(alpha: 0.08),
    );
  }

  static FilledButtonThemeData _temaBotonPrincipal() {
    return FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: ColoresApp.primario,
        foregroundColor: ColoresApp.superficie,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radios.md),
        ),
        textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
      ),
    );
  }

  static InputDecorationTheme _temaInput() {
    final OutlineInputBorder borde = OutlineInputBorder(
      borderRadius: BorderRadius.circular(Radios.md),
      borderSide: const BorderSide(color: ColoresApp.bordeInput, width: 1.5),
    );
    return InputDecorationTheme(
      filled: true,
      fillColor: ColoresApp.superficie,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: borde,
      enabledBorder: borde,
      focusedBorder: borde.copyWith(
        borderSide: const BorderSide(color: ColoresApp.primario, width: 1.8),
      ),
      hintStyle: const TextStyle(color: ColoresApp.textoPlaceholder, fontSize: 16),
    );
  }
}
