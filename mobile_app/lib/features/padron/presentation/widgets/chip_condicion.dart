import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';

/// Chip azul que representa una condición de salud del beneficiario.
class ChipCondicion extends StatelessWidget {
  const ChipCondicion({super.key, required this.nombre, this.conPunto = false});

  final String nombre;
  final bool conPunto;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: conPunto ? 13 : 10,
        vertical: conPunto ? 7 : 4,
      ),
      decoration: BoxDecoration(
        color: ColoresApp.saludFondo,
        borderRadius: BorderRadius.circular(conPunto ? 10 : 8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (conPunto) ...<Widget>[
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: ColoresApp.saludTexto,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            nombre,
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: ColoresApp.saludTexto,
            ),
          ),
        ],
      ),
    );
  }
}
