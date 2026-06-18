import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../domain/entidades/prioridad.dart';

/// Chip que muestra la prioridad del beneficiario (resaltado en rojo si es alta).
class ChipPrioridad extends StatelessWidget {
  const ChipPrioridad({super.key, required this.prioridad, this.conPrefijo = false});

  final Prioridad prioridad;
  final bool conPrefijo;

  @override
  Widget build(BuildContext context) {
    final bool alta = prioridad == Prioridad.alta;
    final Color fondo = alta ? ColoresApp.criticoFondo : ColoresApp.okFondo;
    final Color texto = alta ? ColoresApp.criticoTexto : ColoresApp.okTexto;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: fondo, borderRadius: BorderRadius.circular(20)),
      child: Text(
        conPrefijo ? 'Prioridad ${prioridad.etiqueta}' : prioridad.etiqueta,
        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: texto),
      ),
    );
  }
}
