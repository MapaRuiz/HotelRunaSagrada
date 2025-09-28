import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { HotelsService } from '../../../../services/hotels';
import { Hotel } from '../../../../model/hotel';                // 👈 usa el modelo correcto
import { HotelHeroComponent } from '../hotel-hero/hotel-hero';  // igual que antes
import { HotelAmenitiesComponent } from '../hotel-amenities/hotel-amenities';
import { environment } from '../../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-hotel-detail',
  imports: [CommonModule, HotelHeroComponent, HotelAmenitiesComponent],
  templateUrl: './hotel-detail.html'
})
export class HotelDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private hotels = inject(HotelsService);

  hotel: Hotel | null = null;        // 👈 ahora sí con check_in/out y amenities
  gallery: string[] = [];
  backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.hotels.get(id).subscribe(h => {          // 👈 método real del service: get(id)
      this.hotel = h;
      this.gallery = this.buildGallery(h);
    });
  }

  private first(h: Hotel) {
    // primera imagen = del hotel (para el centro)
    return h.image ?? '/images/hotels/placeholder.jpg';
  }

  /** 8 imágenes por hotel (1 propia + 7 stock relevantes) */
  private buildGallery(h: Hotel): string[] {
    switch (h.name) {
      case 'Runa Sagrada Cartagena':
        return [
          this.first(h),
          'https://media.istockphoto.com/id/1757465332/es/foto/toma-de-dron-de-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=MwDq6w-HmOcDsRZI3u41RdyK-JsNBpGkokuKkNnDD3A=',
          'https://media.istockphoto.com/id/1481727851/es/foto/distrito-hist%C3%B3rico-de-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=MI_61mVSwHfnod2BCbztvavk__OF50fV4qYoXhs_DWY=',
          'https://media.istockphoto.com/id/1476784905/es/foto/palenquera-caminando-y-bailando-en-la-calle-en-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=0PdF4tV2PzakCADHXnX7ZbrHoBsBApXpeulA8ZI0pG0=',
          'https://media.istockphoto.com/id/2163251250/es/foto/photograph-archive-of-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=sHoim7tcqMrxhkweL9MX_7J6K4xmpW09QQtKTm1tszA=',
          'https://media.istockphoto.com/id/1757584675/es/foto/pareja-multirracial-visita-cartagena-en-colombia.jpg?s=612x612&w=0&k=20&c=XEMqQ3ntpiO2ZlbgMRbmfksqKifxjO1ItOZ2BmXO6ks=',
          'https://media.istockphoto.com/id/587775392/es/foto/atardecer-p%C3%BArpura-sobre-muro-defensivo-cartagena-de-indias-colombia.jpg?s=612x612&w=0&k=20&c=c8QgERtuL8ffh93nf38VnsA8w41NC1IrHrw-rpJ6ut0=',
          'https://media.istockphoto.com/id/1734729835/es/foto/hermoso-cielo-de-puesta-de-sol-sobre-el-mar-con-palmeras-y-edificio-frente-a-la-muralla-de-la.jpg?s=612x612&w=0&k=20&c=aGuFkWWHbxJdlLrV0VR8_V89r5HHCC-9vRaDduPVO-Y=',
          'https://media.istockphoto.com/id/895911182/es/foto/islas-del-rosario-en-cartagena-de-indias-colombia-vista-a%C3%A9rea.jpg?s=612x612&w=0&k=20&c=0bFuGxZ1KnBTTI5KewLymvpaMBv1UbP2_UokKRHCTt0='
        ];

      case 'Runa Sagrada Eje Cafetero':
        return [
          this.first(h),
          'https://media.istockphoto.com/id/1043769952/es/foto/valle-del-cocora.jpg?s=612x612&w=0&k=20&c=UwqouBLPSNV6MjiBlqaiAMD-ZF0U85Wr-q7LCW7ezmg=',
          'https://media.istockphoto.com/id/1363338324/es/foto/hermoso-balc%C3%B3n-tradicional-de-madera-de-las-zonas-rurales-de-colombia-decorado-con-plantas-con.jpg?s=612x612&w=0&k=20&c=fq9ZeGy1S4a68U00reZMY2LVwkziqCcziZFmxvgcqsM=',
          'https://media.istockphoto.com/id/1417650775/es/foto/guatape-es-uno-de-los-pueblos-m%C3%A1s-importantes-en-la-arquitectura-de-estilo-colonial-debido-a.jpg?s=612x612&w=0&k=20&c=9g3AHRfhAZ3ErM99GmILiqPS7B_dSKD-WVAiUE9UL1Q=',
          'https://media.istockphoto.com/id/925091604/es/foto/mano-recogiendo-granos-de-caf%C3%A9-en-la-plantaci%C3%B3n-de-caf%C3%A9-de-colombia.jpg?s=612x612&w=0&k=20&c=MERU5MnBN6wqeN2ZYOfcSn_vBR4gbKppOJ2gqNOmP6Q=',
          'https://media.istockphoto.com/id/1412824220/es/foto/colombia.jpg?s=612x612&w=0&k=20&c=Uhr-vfhbpqnINtjXfom__YoEhV3ucTHSY81wK0EPU1s=',
          'https://media.istockphoto.com/id/1348058356/es/foto/turistas-vestidos-con-ropa-tradicional-colombiana-posando-frente-al-fot%C3%B3grafo.jpg?s=612x612&w=0&k=20&c=4wevmtWQiCZM1ibcKlVyRXCGbgtctYV3MbED4f7D6pQ=',
          'https://media.istockphoto.com/id/1363332430/es/foto/salento-colombia-hombre-vestido-con-el-atuendo-tradicional-de-los-arrieros-en-el-peque%C3%B1o.jpg?s=612x612&w=0&k=20&c=-F165GbFxnHyLgBUMyk85mpFobsAnpFOPYQD0KGBeh0=',
          'https://media.istockphoto.com/id/1417652956/es/foto/guatape-es-uno-de-los-pueblos-m%C3%A1s-importantes-en-la-arquitectura-de-estilo-colonial-debido-a.jpg?s=612x612&w=0&k=20&c=uvFCDcdBgwfLwbN5SozwUrttJdfOOxHIjlotxbtZjic='
        ];

      case 'Runa Sagrada San Andrés':
        return [
          this.first(h),
          'https://media.istockphoto.com/id/587782960/es/foto/san-andr%C3%A9s.jpg?s=612x612&w=0&k=20&c=aohl5W-Y8QtECFQgt5JiSo3LN8pkc_Bc8m-lWVTPRLg=',
          'https://media.istockphoto.com/id/587792676/es/foto/snorkeling-con-peces.jpg?s=612x612&w=0&k=20&c=0Z6ZsfYoRJeZ48wQZ_xXn4TIUBIa9j-TOCjP4_R5cOc=',
          'https://media.istockphoto.com/id/177786779/es/foto/peque%C3%B1a-isla-privada.jpg?s=612x612&w=0&k=20&c=OLW1S9fqtu1MPtq1fCki0SC6bNkNPqh84UP46z7BLaE=', 
          'https://media.istockphoto.com/id/1194266151/es/foto/isla-san-andr%C3%A9s-en-el-caribe-colombia.jpg?s=612x612&w=0&k=20&c=i7vVHFHif9laBSCGzqvcOws-m5cNirRAZ67no3wS-fg=',
          'https://media.istockphoto.com/id/1481751009/es/foto/encantadora-isla-de-san-andr%C3%A9s.jpg?s=612x612&w=0&k=20&c=HWnDSafJKQvMvhMSjnEZ9MI8_5SxafWl7MJO-Jfjf08=',
          'https://media.istockphoto.com/id/921459614/es/foto/colorido-que-amor-san-andres-frase-escultura-al-aire-libre-y-cerca-de-la-playa-de-san-andres.jpg?s=612x612&w=0&k=20&c=ymNCrR5O7ISVHl3gpdvIpSFkiu9LpEMmWSzMTbJjWoo=', 
          'https://media.istockphoto.com/id/921504196/es/foto/autob%C3%BAs-de-transporte-p%C3%BAblico-colorido-haciendo-el-ida-y-vuelta-todo-alrededor-de-la-isla-de.jpg?s=612x612&w=0&k=20&c=S-W8llanB7dxtEZv0QaBO1D3krrWK7rVuPEpqL8NBec=',
          'https://media.istockphoto.com/id/592032388/es/foto/isla-johnny-cay.jpg?s=612x612&w=0&k=20&c=umQfeQyZgdItPMaP0-W3IqjUQ9dhAzP_rkA6Z9cFhnY='
        ];

      case 'Runa Sagrada Santa Marta':
        return [
          this.first(h),
          'https://media.istockphoto.com/id/540131342/es/foto/tayrona-salida-del-sol.jpg?s=612x612&w=0&k=20&c=KeFAkXkfvYI-GFH8B-79Rx0TaAP_LfWMrIXAd03ayKQ=',
          'https://media.istockphoto.com/id/516592287/es/foto/playa-y-bandera-colombiana.jpg?s=612x612&w=0&k=20&c=-E1t_RgmkNd3qkob3S5ASW3UoHNpEP58wsIif5yf-xw=',
          'https://media.istockphoto.com/id/500733200/es/foto/beautifulsea-y-vista-a-la-ciudad-de-rodadero-playa-santa-marta-colombia.jpg?s=612x612&w=0&k=20&c=GO83lQWx2NrmDV6-aBXuGi_Ywq3xDfrh417jkui6_6Q=',
          'https://media.istockphoto.com/id/1134245740/es/foto/vista-panor%C3%A1mica-de-las-terrazas-de-la-ciudad-perdida-en-la-sierra-nevada-de-sante-marta-santa.jpg?s=612x612&w=0&k=20&c=yXL5wgtvVKhNqYvgNVOKU_d60Jqm4WcNA1Vhij7PcYU=', 
          'https://media.istockphoto.com/id/1387056240/es/foto/catedral-de-santa-marta.jpg?s=612x612&w=0&k=20&c=qUuDNsF8WA3LyiowGVlHem-ht3yUBUyJB45OPQBlQ80=',
          'https://media.istockphoto.com/id/484727954/es/foto/atestado-playa-en-la-isla-caribe%C3%B1a-de-colombia.jpg?s=612x612&w=0&k=20&c=3o5ZCWg0eJtxM2r6DcAD31H9iuWAryfEuU9BWji5wyA=', 
          'https://media.istockphoto.com/id/513363474/es/foto/barcos-en-taganga-colombia.jpg?s=612x612&w=0&k=20&c=6VTS4L07_MwkTZad6PgxWuqmw0xYWlLE5dr9vIljtXc=', 
          'https://media.istockphoto.com/id/1124505926/es/foto/la-se%C3%B1ora-camina-por-la-carretera-en-santa-marta-colombia.jpg?s=612x612&w=0&k=20&c=HjEb1Jwnndfo0OJhV9bbYFPJcWzfJIuZ_3PaeqWJ1y4='  
        ];

      case 'Runa Sagrada Villa de Leyva':
        return [
          this.first(h),
          'https://media.istockphoto.com/id/515741163/es/foto/villa-de-leyva-colombia-domingos-morinig-en-la-calle-14.jpg?s=612x612&w=0&k=20&c=IidfzMW1Hq6Yi3iaIIFQGFwjXr6IYajXbjB9aMEGq-g=', 
          'https://media.istockphoto.com/id/1134256388/es/foto/plaza-mayor-in-villa-de-leyva.jpg?s=612x612&w=0&k=20&c=EjsQvclSlMdzhsL9pR5T86xG6xqla_79NTDpl375Npw=',
          'https://media.istockphoto.com/id/1736370502/es/foto/zona-de-parque-ordenada-con-un-edificio-tradicional-en-la-parte-trasera-en-un-d%C3%ADa-soleado.jpg?s=612x612&w=0&k=20&c=uZpnFn0spaoh5JlVShBLjZf2BkSYQRR49xnCIlzW1JY=', 
          'https://media.istockphoto.com/id/518016015/es/foto/recuerdos-en-raquira.jpg?s=612x612&w=0&k=20&c=SEHKIDiNUR6HYX1ew9v1E55OZeZtwYCZeYxqgcpPo2Y=', 
          'https://media.istockphoto.com/id/1412643601/es/foto/terraza-decorada-con-flores-en-raquira-colombia.jpg?s=612x612&w=0&k=20&c=MgNG2T4NSZUVCGY4FQtuOc04dD2SjYwQ7pzg9FyHMSs=',
          'https://media.istockphoto.com/id/2154138843/es/foto/casa-terracota-house-made-of-clay-villa-de-leyva-boyaca-department-colombia.jpg?s=612x612&w=0&k=20&c=nxLg68X49yUfspi5wydmqbAGf6iZlzzoQjZwlq5mffQ=', 
          'https://media.istockphoto.com/id/665208746/es/foto/villa-de-leyva-colombia-15-de-noviembre-de-2014-plaza-central-de-villa-de-leyva-con-edificios.jpg?s=612x612&w=0&k=20&c=xyj-FaOQUFr8Ubo1lVncQPB-rBvTgJKKHDr17uLho4Y=', 
          'https://media.istockphoto.com/id/1625543136/es/foto/el-t%C3%ADpico-cami%C3%B3n-colorido-transporta-a-los-turistas-en-un-recorrido-por-las-atracciones-de-la.jpg?s=612x612&w=0&k=20&c=yDo26AsprocSL2v9c1-cQdfLDxLHP1gcKLQJ0-TPRMg='
        ];

      default:
        // fallback genérico
        return [
          this.first(h),
          'https://media.istockphoto.com/id/1757465332/es/foto/toma-de-dron-de-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=MwDq6w-HmOcDsRZI3u41RdyK-JsNBpGkokuKkNnDD3A=',
          'https://media.istockphoto.com/id/1481727851/es/foto/distrito-hist%C3%B3rico-de-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=MI_61mVSwHfnod2BCbztvavk__OF50fV4qYoXhs_DWY=',
          'https://media.istockphoto.com/id/1476784905/es/foto/palenquera-caminando-y-bailando-en-la-calle-en-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=0PdF4tV2PzakCADHXnX7ZbrHoBsBApXpeulA8ZI0pG0=',
          'https://media.istockphoto.com/id/2163251250/es/foto/photograph-archive-of-cartagena-colombia.jpg?s=612x612&w=0&k=20&c=sHoim7tcqMrxhkweL9MX_7J6K4xmpW09QQtKTm1tszA=',
          'https://media.istockphoto.com/id/1757584675/es/foto/pareja-multirracial-visita-cartagena-en-colombia.jpg?s=612x612&w=0&k=20&c=XEMqQ3ntpiO2ZlbgMRbmfksqKifxjO1ItOZ2BmXO6ks=',
          'https://media.istockphoto.com/id/587775392/es/foto/atardecer-p%C3%BArpura-sobre-muro-defensivo-cartagena-de-indias-colombia.jpg?s=612x612&w=0&k=20&c=c8QgERtuL8ffh93nf38VnsA8w41NC1IrHrw-rpJ6ut0=',
          'https://media.istockphoto.com/id/1734729835/es/foto/hermoso-cielo-de-puesta-de-sol-sobre-el-mar-con-palmeras-y-edificio-frente-a-la-muralla-de-la.jpg?s=612x612&w=0&k=20&c=aGuFkWWHbxJdlLrV0VR8_V89r5HHCC-9vRaDduPVO-Y=',
          'https://media.istockphoto.com/id/895911182/es/foto/islas-del-rosario-en-cartagena-de-indias-colombia-vista-a%C3%A9rea.jpg?s=612x612&w=0&k=20&c=0bFuGxZ1KnBTTI5KewLymvpaMBv1UbP2_UokKRHCTt0='
        ];
    }
  }
}