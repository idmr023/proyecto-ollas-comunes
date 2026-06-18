import 'package:flutter/widgets.dart';

/// Constantes globales de espaciado, radios y duraciones para evitar números
/// mágicos en los widgets, siguiendo los estándares del proyecto.
abstract final class Espaciado {
  static const double xs = 6;
  static const double sm = 10;
  static const double md = 14;
  static const double lg = 20;
  static const double xl = 28;
  static const double xxl = 40;
}

abstract final class Radios {
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double xl = 26;
  static const Radius redondoSm = Radius.circular(sm);
  static const Radius redondoMd = Radius.circular(md);
  static const Radius redondoLg = Radius.circular(lg);
}

abstract final class Duraciones {
  static const Duration corta = Duration(milliseconds: 200);
  static const Duration media = Duration(milliseconds: 350);
  static const Duration splash = Duration(milliseconds: 2200);
}
