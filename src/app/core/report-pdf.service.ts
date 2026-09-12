import {Injectable} from '@angular/core';
import {GState,jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';

export type PdfColumn={key:string;label:string};

@Injectable({providedIn:'root'})
export class ReportPdfService{
 private logo?:string;

 async download(title:string,subtitle:string,period:string,columns:PdfColumn[],rows:any[],format:(value:any,key:string)=>string,fileName:string){
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const logo=await this.logoData();
  autoTable(doc,{
   startY:34,
   margin:{top:34,right:12,bottom:18,left:12},
   head:[columns.map(x=>x.label)],
   body:rows.map(row=>columns.map(column=>format(row[column.key],column.key))),
   theme:'grid',
   styles:{font:'helvetica',fontSize:7.5,cellPadding:2.3,textColor:[30,41,59],lineColor:[226,232,240],lineWidth:.15,overflow:'linebreak'},
   headStyles:{fillColor:[15,118,110],textColor:255,fontStyle:'bold',halign:'center'},
   alternateRowStyles:{fillColor:[248,250,252]},
   columnStyles:{0:{halign:'left',fontStyle:'bold'}},
   didDrawPage:data=>{
    const width=doc.internal.pageSize.getWidth(),height=doc.internal.pageSize.getHeight();
    doc.saveGraphicsState();doc.setGState(new GState({opacity:.065}));doc.addImage(logo,'JPEG',(width-96)/2,(height-96)/2,96,96);doc.restoreGraphicsState();
    doc.setTextColor(15,23,42);doc.setFontSize(15);doc.setFont('helvetica','bold');doc.text('REAL CAPITA GROUP',12,13);
    doc.setFontSize(11);doc.text(title,12,21);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(100,116,139);doc.text(subtitle,12,27);
    doc.setFont('helvetica','bold');doc.text(period,width-12,14,{align:'right'});doc.setFont('helvetica','normal');doc.text(`Generated ${new Date().toLocaleString('en-BD')}`,width-12,21,{align:'right'});
    doc.setDrawColor(15,118,110);doc.setLineWidth(.5);doc.line(12,30,width-12,30);
    doc.setDrawColor(226,232,240);doc.setLineWidth(.2);doc.line(12,height-12,width-12,height-12);doc.setTextColor(100,116,139);doc.setFontSize(7);doc.text('Confidential CRM performance report',12,height-7);doc.text(`Page ${data.pageNumber}`,width-12,height-7,{align:'right'});
   }
  });
  doc.save(`${this.safe(fileName)}.pdf`);
 }

 private async logoData(){
  if(this.logo)return this.logo;
  const response=await fetch('/assets/real-capita-report-watermark.jpg');
  if(!response.ok)throw new Error('Report logo could not be loaded.');
  const blob=await response.blob();
  this.logo=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)});
  return this.logo;
 }
 private safe(value:string){return value.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'crm-report'}
}
