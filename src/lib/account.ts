import axios from "axios";
import { EmailMessage, SyncResponse, SyncUpdatedResponse } from "./types";

export class Account{

    private token:string;

    constructor(token:string){
        this.token = token;
    }
    async performInitialSync(){
        try {
            //start the sync process
            let syncResponse = await this.startSync();
            while(!syncResponse.ready){
                await new Promise(resolve=>setTimeout(resolve,1000));
                syncResponse = await this.startSync();
            }

            // get bookmark delta Token
            let storedDeltaToken:string = syncResponse.syncUpdatedToken;
            let updatedResponse = await this.getUpdatedEmails({deltaToken:storedDeltaToken})

            if(updatedResponse.nextDeltaToken){
                storedDeltaToken = updatedResponse.nextDeltaToken;
            }

            const allEmails : EmailMessage[] = updatedResponse.records;

            //fetch all pages if there are more

            while(updatedResponse.nextPageToken){
                updatedResponse = await this.getUpdatedEmails({pageToken:updatedResponse.nextPageToken});
                allEmails.concat(updatedResponse.records);
                if(updatedResponse.nextDeltaToken){
                    //sync has ended
                    storedDeltaToken = updatedResponse.nextDeltaToken;
                }
            }

            console.log('initial sync completed, synced ',allEmails.length,'emails');

            return {
                emails:allEmails,
                deltaToken:storedDeltaToken
            };
        } catch (error) {
            if(axios.isAxiosError(error)){
                console.error(error.response?.data);
            }else{
                console.error(error);
            }
        }
    }
    private async startSync(){
        const res = await axios.post<SyncResponse>('https://api.aurinko.io/v1/email/sync',{},{
            headers:{
                Authorization : `Bearer ${this.token}`
            },
            params:{
                daysWithin:2,
                bodyType:'html'
            }
        });
        return res.data;
    }
    private async getUpdatedEmails({deltaToken,pageToken}:{deltaToken?:string,pageToken?:string}){
        let params :Record<string,string> = {};
        if(deltaToken)params.deltaToken = deltaToken;
        if(pageToken)params.pageToken = pageToken

        const response = await axios.get<SyncUpdatedResponse>('https://api.aurinko.io/v1/email/sync/updated',{
            headers:{
                Authorization : `Bearer ${this.token}`
            },
            params
        })
        return response.data;
    }
}