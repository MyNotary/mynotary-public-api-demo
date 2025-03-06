'use client';

/**
 * Cette classe va stocker un tableau d'objets qui contiennent les associations entre les différentes entités de
 * l'application externe et MyNotary.
 * Ces associations permettent d'éviter les doublons sur MyNotary et garder une trace des dossiers en cours dans
 * l'application externe.
 *
 * En situation réelle, cette classe serait implémentée dans un service de stockage de données persitant (ex: base de données)
 */
class DatabaseClient {
  private associations: Association[] = [];

  public addAssociation(association: Association): void {
    this.associations.push(association);
    this.saveAssociations();
  }

  public findMyNotaryRecordLocalDatabase(externalId: string): number | undefined {
    const association = this.associations.find(
      (association) => association.externalId === externalId && association.type === 'RECORD'
    );

    return association?.myNotaryId;
  }

  public findMynotaryOperationId(externalId: string): number | undefined {
    const association = this.associations.find(
      (association) => association.externalId === externalId && association.type === 'OPERATION'
    );
    return association?.myNotaryId;
  }

  public saveAssociations(): void {
    localStorage.setItem('associations', JSON.stringify(this.associations));
  }

  public loadAssociations(): void {
    const associations = localStorage.getItem('associations');
    if (associations) {
      this.associations = JSON.parse(associations);
    }
  }

  public clearAssociations(): void {
    this.associations = [];
    this.saveAssociations();
    window.location.reload();
  }

  public getHouses(): House[] {
    return [
      {
        id: 'external_app_house_1',
        address: {
          street: '1 rue du pardis',
          zipCode: '69002',
          city: 'Lyon',
          country: 'France'
        },
        price: 185000,
        surface: 45
      },
      {
        id: 'external_app_house_2',
        address: {
          street: '9 rue du moulin',
          zipCode: '69001',
          city: 'Lyon',
          country: 'France'
        },
        price: 256000,
        surface: 75
      }
    ];
  }
}

interface Association {
  type: 'RECORD' | 'OPERATION';
  externalId: string;
  myNotaryId: number;
}

export interface House {
  id: string;
  address: {
    street: string;
    zipCode: string;
    city: string;
    country: string;
  };
  price: number;
  surface: number;
}

export const databaseClient = new DatabaseClient();
