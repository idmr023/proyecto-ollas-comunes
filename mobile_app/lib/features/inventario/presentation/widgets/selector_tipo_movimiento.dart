import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../domain/tipo_movimiento.dart';

/// Selector segmentado entre Entrada y Salida, fiel al mockup.
class SelectorTipoMovimiento extends StatelessWidget {
  const SelectorTipoMovimiento({
    super.key,
    required this.seleccionado,
    required this.onCambio,
  });

  final TipoMovimiento seleccionado;
  final ValueChanged<TipoMovimiento> onCambio;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: ColoresApp.superficieAlterna,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: _Opcion(
              etiqueta: 'Entrada',
              icono: Icons.arrow_upward_rounded,
              activo: seleccionado == TipoMovimiento.entrada,
              colorActivo: ColoresApp.okPunto,
              onTap: () => onCambio(TipoMovimiento.entrada),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _Opcion(
              etiqueta: 'Salida',
              icono: Icons.arrow_downward_rounded,
              activo: seleccionado == TipoMovimiento.salida,
              colorActivo: ColoresApp.criticoPunto,
              onTap: () => onCambio(TipoMovimiento.salida),
            ),
          ),
        ],
      ),
    );
  }
}

class _Opcion extends StatelessWidget {
  const _Opcion({
    required this.etiqueta,
    required this.icono,
    required this.activo,
    required this.colorActivo,
    required this.onTap,
  });

  final String etiqueta;
  final IconData icono;
  final bool activo;
  final Color colorActivo;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: activo ? ColoresApp.superficie : Colors.transparent,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Icon(
              icono,
              size: 17,
              color: activo ? colorActivo : ColoresApp.textoTenue,
            ),
            const SizedBox(width: 7),
            Text(
              etiqueta,
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w700,
                color: activo ? colorActivo : ColoresApp.textoTenue,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
