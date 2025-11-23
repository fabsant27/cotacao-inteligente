export interface Company {
  cnpj: string;
  name: string;
  email: string;
  phone: string;
  cell: string;
  whatsapp: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  logoUrl: string;
  primaryColor: string;
  signatureUrl: string;
}

export interface Client {
  doc: string; // CNPJ or CPF
  name: string;
  email: string;
  phone: string;
  cell: string;
  whatsapp: string;
  address: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  hideContacts: boolean;
}

export interface QuoteItem {
  id: string;
  name: string;
  ncm: string;
  packaging: string; // XXXXXXXX format
  quantity: number;
  unitCost: number; // Hidden from client
  markup: number; // Hidden from client
  unitPrice: number; // Calculated
  totalPrice: number; // Calculated
}

export enum FreightType {
  CIF = 'CIF',
  FOB = 'FOB',
}

export enum PaymentMethod {
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  CREDIT_CARD = 'CREDIT_CARD',
  TRANSFER = 'TRANSFER',
}

export interface QuoteConfig {
  number: number;
  freightType: FreightType;
  deliveryDays: number;
  deliveryType: 'DC' | 'DU'; // Dias Corridos / Dias Úteis
  paymentMethod: PaymentMethod;
  boletoCondition: '28ddl' | '30/60/90ddl' | '';
  senderCep: string;
  receiverCep: string;
  distanceKm: number;
  calculatedFreight: number;
}