import supertest from 'supertest';
import app from '../server';
import { Blob } from 'node-fetch';
import fs from 'fs/promises';
import FormData from 'form-data';
import { it, describe, expect } from 'vitest';

describe('POST /api/post & DELETE /api/post', () => {
	let token;
	const urlPattern = /^(http|https):\/\/[^ "]+$/;
	const user = {
		email: 'test44@test44.com',
		username: 'test44',
		password: '123_abc',
		name: 'Tester',
		bio: "I'm a test account.",
		image: 'https://firebasestorage.googleapis.com/v0/b/ig-clone-5b7ab.appspot.com/o/lsNWDlodVDUB7RmeRY9qZDe1S3k2%2FScreenshot%202023-04-14%20at%2017-10-51%20Markstagram.png?alt=media&token=7a1080c3-c648-4ef4-b5e4-f6da3760182d',
		id: undefined,
	};
	const caption = 'this is a test';
	let post;
	it('should create user, get web token, user id, & a 200 status', async () => {
		const response = await supertest(app)
			.post('/create_new_user')
			.send(user);
		token = response.body.token;
		expect(response.body.token).toBeDefined();
		user.id = response.body.user?.id;
		expect(response.body.user?.id).toBeDefined();
		expect(response.status).toBe(200);
	});
	it('should create a post & return a 200 error + correct post info', async () => {
		// const buffer = await fs.readFile('./src/__tests__/test.png');
		// const formData = new FormData();
		// formData.append('file', buffer, {
		// 	filename: 'test.png',
		// 	contentType: 'image/png',
		// });
		// formData.append('caption', caption);
		// const header = formData.getHeaders()['content-type'];
		// expect(header).toMatch(/^multipart\/form-data;/);
		const response = await supertest(app)
			.post('/api/post')
			.set('Authorization', `Bearer ${token}`)
			// .set('Content-Type', header)
			.set('Content-Type', 'multipart/form-data')
			.field('caption', caption)
			.attach('file', './src/__tests__/test.png');
		// .send(formData);
		post = response.body.post;
		expect(response.status).toBe(200);
		expect(post?.userId).toBe(user.id);
		expect(post?.caption).toBe(caption);
		expect(post?.image).toHaveProperty('type', 'Buffer');
		expect(Array.isArray(post?.image?.data)).toBe(true);
	});
	it('should delete a post & return a 200 code + correct post info', async () => {
		const response = await supertest(app)
			.delete('/api/post')
			.set('Authorization', `Bearer ${token}`)
			.send({
				id: post.id,
			});
		expect(response.status).toBe(200);
		expect(response.body.post.id).toBe(post.id);
		expect(response.body.post.caption).toBe(caption);
		expect(post?.image).toHaveProperty('type', 'Buffer');
		expect(Array.isArray(post?.image?.data)).toBe(true);
	});
	it('should delete the user & return a 200 code + correct user info', async () => {
		const response = await supertest(app)
			.delete('/api/user')
			.set('Authorization', `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.user.id).toBe(user.id);
	});
});
