import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';

/// Botones de acceso rápido del dashboard hacia Inventario y Padrón.
class AccesosRapidos extends StatelessWidget {
  const AccesosRapidos({super.key, this.onIrInventario, this.onIrPadron});

  final VoidCallback? onIrInventario;
  final VoidCallback? onIrPadron;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Expanded(
          child: _BotonAcceso(
            icono: Icons.inventory_2_outlined,
            etiqueta: 'Inventario',
            onTap: onIrInventario,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: _BotonAcceso(
            icono: Icons.groups_outlined,
            etiqueta: 'Padrón',
            onTap: onIrPadron,
          ),
        ),
      ],
    );
  }
}

class _BotonAcceso extends StatelessWidget {
  const _BotonAcceso({required this.icono, required this.etiqueta, this.onTap});

  final IconData icono;
  final String etiqueta;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ColoresApp.verdeProfundo,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Icon(icono, color: ColoresApp.primarioClaro, size: 26),
              const SizedBox(height: 12),
              Text(etiqueta, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
