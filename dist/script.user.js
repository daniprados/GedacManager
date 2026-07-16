// ==UserScript==
// @name         Gedac manageer
// @namespace    
// @version      1.15.5
// @description  Millores per a la plataforma Gedac
// @author       daniprados
// @license      MIT
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/avaluacio/*
// @match        https://aplicacions.gestioeducativa.gencat.cat/ords/pls/apex/*
// @require      https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js
// @require      https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
// @require      https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js
// @grant        none
// @updateURL    
// @downloadURL  
// ==/UserScript==

(()=>{var r=class t{static TARGET_TITLE="Gesti\xF3 presentaci\xF3 documents matr\xEDcula (CFP)";constructor(e){this.logger=e}isTargetPage(e){let a=[...e.querySelectorAll("h4")].some(c=>this.#e(c.textContent)===t.TARGET_TITLE);return this.logger.debug("Comprovaci\xF3 de la p\xE0gina de matr\xEDcula CFP",{isTarget:a}),a}#e(e){return e?.replace(/\s+/g," ").trim()??""}};var o=class{constructor(e,s){this.logger=e,this.pageDetector=s}start(e){return this.pageDetector.isTargetPage(e)?(this.logger.info("Inicialitzaci\xF3 de les eines de matr\xEDcula CFP"),!0):!1}};(()=>{let t=console,e=new r(t);new o(t,e).start(document)})();})();
