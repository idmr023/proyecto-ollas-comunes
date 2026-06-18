import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../domain/entidades/insumo.dart';
import 'chip_estado_stock.dart';

/// Fila de la lista de inventario: avatar, nombre, cantidad y semáforo de stock.
class TarjetaInsumo extends StatelessWidget {
  const TarjetaInsumo({super.key, required this.insumo, required this.onTap});

  final Insumo insumo;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ColoresApp.superficie,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: ColoresApp.borde),
          ),
          child: Row(
            children: <Widget>[
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(color: ColoresApp.superficieAlterna, borderRadius: BorderRadius.circular(13)),
                alignment: Alignment.center,
                child: Text(
                  insumo.inicial,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17, color: ColoresApp.verdeMedio),
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      insumo.nombre,
                      style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: ColoresApp.textoPrincipal),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      '${insumo.cantidadFormateada} ${insumo.unidad}',
                      style: const TextStyle(fontSize: 12.5, color: ColoresApp.textoTenue),
                    ),
                  ],
                ),
              ),
              ChipEstadoStock(estado: insumo.estado),
            ],
          ),
        ),
      ),
    );
  }
}
