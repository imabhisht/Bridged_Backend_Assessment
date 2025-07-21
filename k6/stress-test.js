import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 100, // 100 virtual users
    duration: '150s', // Run for 30 seconds
};

export default function () {
    http.get('http://localhost:3500/test1');
    sleep(1);
}