import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DoctorWorkspace } from '@/components/hospital/DoctorWorkspace';
export const Route = createFileRoute('/_authenticated/doctor')({
 validateSearch:z.object({tab:z.string().catch('dashboard'),patient:z.string().catch('')}),
 head:()=>({meta:[{title:'Лекарски кабинет · МБАЛ Балчик'},{name:'description',content:'График, прегледи, изследвания, лечение и изписване.'},{property:'og:title',content:'Лекарски кабинет · МБАЛ Балчик'},{property:'og:description',content:'Работно място на лекаря в МБАЛ Балчик.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:DoctorPage,
});
function DoctorPage(){const {tab,patient}=Route.useSearch();return <DoctorWorkspace initialTab={tab} initialPatient={patient}/>;}
