import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../domain/entidades/resumen_dashboard.dart';

/// Tarjeta con la lista de insumos próximos a vencer. Muestra un estado vacío
/// amable cuando no hay ninguno.
class TarjetaInsumosPorVencer extends StatelessWidget {
  const TarjetaInsumosPorVencer({super.key, required this.insumos});

  final List<InsumoPorVencer> insumos;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Insumos por vencer',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: ColoresApp.textoPrincipal,
            ),
          ),
          const SizedBox(height: 12),
          if (insumos.isEmpty)
            const Text(
              'No hay insumos próximos a vencer. ¡Todo en orden!',
              style: TextStyle(
                fontSize: 13.5,
                color: ColoresApp.textoTenue,
                height: 1.5,
              ),
            )
          else
            ...insumos.map(_FilaInsumo.new),
        ],
      ),
    );
  }
}

class _FilaInsumo extends StatelessWidget {
  const _FilaInsumo(this.insumo);

  final InsumoPorVencer insumo;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(
        children: <Widget>[
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: ColoresApp.superficieAlterna,
              borderRadius: BorderRadius.circular(11),
            ),
            alignment: Alignment.center,
            child: Text(
              insumo.nombre.isNotEmpty ? insumo.nombre[0].toUpperCase() : '?',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: ColoresApp.verdeMedio,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  insumo.nombre,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: ColoresApp.textoPrincipal,
                  ),
                ),
                Text(
                  insumo.cantidad,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: ColoresApp.textoTenue,
                  ),
                ),
              ],
            ),
          ),
          Text(
            insumo.venceEn,
            style: const TextStyle(
              fontSize: 12,
              color: ColoresApp.bajoTexto,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
