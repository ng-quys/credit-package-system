export class AuthResponseDto {
  user!: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string | null;
    updatedAt: string | null;
  };

  accessToken!: string;
}
