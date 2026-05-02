# Biblioteca de trilhas sonoras

Esta pasta armazena os arquivos de música usados pelo render quando o usuário ativa "Trilha sonora" no questionário pré-upload.

## Como funciona

1. O usuário escolhe um estilo no questionário: `energetic | calm | epic | comic | melancholic | electronic`.
2. No momento do render, o servidor lista todos os arquivos de áudio dentro de `public/music/{estilo}/` e escolhe **um** de forma determinística (hash do `jobId` → mesma trilha em re-renders do mesmo job, trilhas diferentes em jobs diferentes).
3. O Remotion toca a faixa em loop com **ducking sidechain**: o volume é abaixado automaticamente sempre que há legenda ativa (fala) e sobe gentilmente nos vazios.
4. O nível final segue a preferência `volume: low | medium | high` do questionário (padrão: medium).

## Como adicionar trilhas

Drope arquivos de áudio diretamente em cada pasta de estilo. Formatos aceitos:

```
.mp3  .m4a  .aac  .wav  .ogg  .opus
```

Exemplos:

```
public/music/energetic/upbeat-pop-loop.mp3
public/music/energetic/drums-and-claps.mp3
public/music/calm/lofi-piano.mp3
public/music/epic/cinematic-rise.mp3
```

Você pode colocar quantas faixas quiser por estilo — quanto mais, mais variedade entre vídeos diferentes.

## Recomendações práticas

- **Loopável**: o player faz loop quando o vídeo é mais longo que a faixa. Prefira loops sem cortes audíveis no início/fim.
- **Sem voz**: a trilha é decorativa; vozes/cantores competem com a fala mesmo com ducking.
- **Mix neutro**: evite picos extremos. Trilhas masterizadas em torno de -14 LUFS funcionam bem com o preset `medium`.
- **Direitos**: use apenas trilhas livres-de-direitos ou licenciadas para o uso comercial pretendido.

## Volumes (referência)

Os presets em `lib/soundtrack.ts` controlam o nível resultante:

| Preset | Volume sem fala | Volume na fala (ducked) |
|--------|----------------|-------------------------|
| low    | 0.10 (-20 dB)  | 0.04 (-28 dB) |
| medium | 0.20 (-14 dB)  | 0.08 (-22 dB) |
| high   | 0.35 (-9 dB)   | 0.14 (-17 dB) |

A diferença `base → ducked` é ~8 dB, suficiente para deixar a fala dominante sem fazer a música "sumir".

## Estilo "outro"

Se o usuário escolhe `style: other`, o render **não toca trilha** (não temos uma pasta correspondente). O upload emite um warning sugerindo escolher um estilo curado.
