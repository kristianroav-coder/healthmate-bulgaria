import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DoctorWorkspace } from '@/components/hospital/DoctorWorkspace';
export const Route = createFileRoute('/_authenticated/doctor')({
 validateSearch:z.object({tab:z.string().catch('dashboard'),patient:z.string().catch('')}),
 head:()=>({meta:[{title:'Лекарски кабинет · МБАЛ'}]}),
 component:DoctorPage,
});
function DoctorPage(){const {tab,patient}=Route.useSearch();return <DoctorWorkspace initialTab={tab} initialPatient={patient}/>;}
