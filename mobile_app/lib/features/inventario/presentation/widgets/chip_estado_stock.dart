import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../domain/entidades/estado_stock.dart';

/// Chip con el semáforo de estado de stock (en stock / bajo / crítico).
class ChipEstadoStock extends StatelessWidget {
  const ChipEstadoStock({super.key, required this.estado});

  final EstadoStock estado;

  @override
  Widget build(BuildContext context) {
    final (Color fondo, Color texto, Color punto) = _colores(estado);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: punto, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            estado.etiqueta,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: texto,
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color, Color) _colores(EstadoStock estado) {
    return switch (estado) {
      EstadoStock.ok => (
        ColoresApp.okFondo,
        ColoresApp.okTexto,
        ColoresApp.okPunto,
      ),
      EstadoStock.bajo => (
        ColoresApp.bajoFondo,
        ColoresApp.bajoTexto,
        ColoresApp.bajoPunto,
      ),
      EstadoStock.critico => (
        ColoresApp.criticoFondo,
        ColoresApp.criticoTexto,
        ColoresApp.criticoPunto,
      ),
    };
  }
}
