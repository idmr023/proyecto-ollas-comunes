import 'package:flutter/material.dart';
import '../../core/tema/colores_app.dart';

/// Logo de la app: una olla dentro de un cuadrado redondeado con gradiente
/// cálido. Reutilizable en splash, login y cabeceras.
class LogoOlla extends StatelessWidget {
  const LogoOlla({super.key, this.tamano = 104, this.radio = 30});

  final double tamano;
  final double radio;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: tamano,
      height: tamano,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radio),
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[ColoresApp.primarioClaro, ColoresApp.primario],
        ),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: ColoresApp.primario.withValues(alpha: 0.4),
            blurRadius: 30,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Icon(
        Icons.soup_kitchen_outlined,
        color: Colors.white,
        size: tamano * 0.52,
      ),
    );
  }
}
