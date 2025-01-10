import { Injectable } from '@nestjs/common';
import {
  RDSClient,
  DeleteDBInstanceCommand,
  DescribeDBSnapshotsCommand,
  DeleteDBSnapshotCommand,
  RestoreDBInstanceFromDBSnapshotCommand,
} from '@aws-sdk/client-rds';

@Injectable()
export class DatabaseService {
  private readonly region = process.env.AWS_REGION;
  private readonly dbInstances = process.env.DB.split(',');
  private readonly rdsClient = new RDSClient({ region: this.region });

  removeDB(dbInstance: string, SkipFinalSnapshot: boolean = false) {
    const snapshotName = `${dbInstance}-snapshot`;
    const params = {
      DBInstanceIdentifier: dbInstance,
      SkipFinalSnapshot: SkipFinalSnapshot,
      DeleteAutomatedBackups: true,
    };
    if (!SkipFinalSnapshot) {
      params['FinalDBSnapshotIdentifier'] = snapshotName;
    }
    const command = new DeleteDBInstanceCommand(params);
    return this.sendCommand(command);
  }
  getSnapshots(dbInstance: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // get snapshots start by dbInstance name
        const command = new DescribeDBSnapshotsCommand({
          Filters: [
            {
              Name: 'db-instance-id', // Filtra por el ID de la base de datos
              Values: [dbInstance],
            },
          ],
        });

        const response = await this.rdsClient.send(command);
        const snapshots = (response.DBSnapshots || []).sort((a, b) => {
          return (
            new Date(b.SnapshotCreateTime).getTime() -
            new Date(a.SnapshotCreateTime).getTime()
          );
        });
        // filter snapshot manuals
        const snapshotsFiltered = snapshots.filter((snapshot) => {
          return snapshot.SnapshotType == 'manual';
        });
        resolve(snapshotsFiltered);
      } catch (error) {
        reject(error);
      }
    });
  }

  async databaseDown() {
    for (const dbInstance of this.dbInstances) {
      console.log(JSON.stringify(process.env));
      // get snapshots
      console.log(`Getting snapshots for ${dbInstance}`);
      try {
        const snapshots = await this.getSnapshots(dbInstance);
        console.log(`Total snapshots for ${dbInstance}: ${snapshots.length}`);
        if (snapshots.length > 0) {
          // remove all snapshots except the last 1
          const snapshotRemove = [];
          console.log(
            `Removing snapshots for ${dbInstance}, total ${snapshots.length - 3}`,
          );
          for (const snapshot of snapshots) {
            snapshotRemove.push(
              this.removeSnapshot(snapshot.DBSnapshotIdentifier),
            );
          }
          await Promise.all(snapshotRemove);
        }
        console.log(`Removing database ${dbInstance}`);
        await this.removeDB(dbInstance);
      } catch (error) {
        console.log(`Error getting snapshots for ${dbInstance}:`, error);
      }
    }
  }

  async databaseUp() {
    for (const dbInstance of this.dbInstances) {
      const snapshots = await this.getSnapshots(dbInstance);
      if (snapshots.length == 0) {
        console.log(`No snapshots found for ${dbInstance}`);
        return '';
      }
      const lastSnapshot = snapshots[0];
      console.log(`Restoring snapshot for ${dbInstance}`);
      await this.restoreSnapshot(lastSnapshot.DBSnapshotIdentifier, dbInstance);
    }
  }

  removeSnapshot(snapshotId: string) {
    // remove snapshot
    const command = new DeleteDBSnapshotCommand({
      DBSnapshotIdentifier: snapshotId, // ID del snapshot
    });

    return this.sendCommand(command);
  }

  restoreSnapshot(snapshotId: string, dbInstance: string) {
    const command = new RestoreDBInstanceFromDBSnapshotCommand({
      DBInstanceIdentifier: dbInstance, // ID de la base de datos
      DBSnapshotIdentifier: snapshotId, // ID del snapshot
      MultiAZ: false,
      PubliclyAccessible: false,
      DBSubnetGroupName: process.env.DB_SUBNET_GROUP_NAME,
      VpcSecurityGroupIds: [process.env.VPC_SEGURITY_GROUP_ID],
    });

    return this.sendCommand(command);
  }
  sendCommand(command: any) {
    if (process.env.DEBUG == 'true') {
      console.log(command);
      return new Promise((resolve) => {
        resolve(command);
      });
    }
    return this.rdsClient.send(command);
  }
}
