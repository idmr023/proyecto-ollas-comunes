import 'package:flutter/material.dart';

/// Paleta de colores de SIGO-OLLAS, extraída del mockup oficial.
/// Tono cálido y comunitario: terracota como primario y verde profundo como base.
abstract final class ColoresApp {
  // Primario (terracota / naranja cálido)
  static const Color primario = Color(0xFFE0702E);
  static const Color primarioOscuro = Color(0xFFCB6224);
  static const Color primarioClaro = Color(0xFFF09A45);
  static const Color primarioSuave = Color(0xFFFBEEE3);

  // Verde profundo (marca / cabeceras)
  static const Color verdeProfundo = Color(0xFF123128);
  static const Color verdeMedio = Color(0xFF1A5C3F);
  static const Color verdeClaro = Color(0xFFA7CBB7);

  // Fondos y superficies
  static const Color fondo = Color(0xFFF6F4EF);
  static const Color fondoExterno = Color(0xFFE7E5DF);
  static const Color superficie = Color(0xFFFFFFFF);
  static const Color superficieAlterna = Color(0xFFF3EFE7);

  // Texto
  static const Color textoPrincipal = Color(0xFF1B2A22);
  static const Color textoSecundario = Color(0xFF43564C);
  static const Color textoTerciario = Color(0xFF6B7A70);
  static const Color textoTenue = Color(0xFF8A968D);
  static const Color textoPlaceholder = Color(0xFF9AA69E);

  // Bordes
  static const Color borde = Color(0xFFEFEAE1);
  static const Color bordeFuerte = Color(0xFFE8E2D8);
  static const Color bordeInput = Color(0xFFE0D9CD);

  // Estado: en stock (ok / verde)
  static const Color okFondo = Color(0xFFE4F3E9);
  static const Color okTexto = Color(0xFF1E7A45);
  static const Color okPunto = Color(0xFF2E9E5B);

  // Estado: stock bajo (ámbar)
  static const Color bajoFondo = Color(0xFFFBEFD6);
  static const Color bajoTexto = Color(0xFF9A6B12);
  static const Color bajoPunto = Color(0xFFE5A93D);

  // Estado: crítico (rojo)
  static const Color criticoFondo = Color(0xFFFBE3E0);
  static const Color criticoTexto = Color(0xFFB23A2E);
  static const Color criticoPunto = Color(0xFFD64A3F);

  // Condiciones de salud (azul)
  static const Color saludFondo = Color(0xFFEAF2F7);
  static const Color saludTexto = Color(0xFF356C8C);
}
