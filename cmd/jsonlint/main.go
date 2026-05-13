package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

const indent = "  "

func main() {
	write := flag.Bool("w", false, "write formatted JSON back to files")
	root := flag.String("root", ".", "root directory to scan")
	flag.Parse()

	var problems int
	err := filepath.WalkDir(*root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			base := filepath.Base(path)
			if base == ".git" || base == "vendor" {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(path), ".json") {
			return nil
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		formatted, err := formatJSON(data)
		if err != nil {
			fmt.Fprintf(os.Stderr, "invalid json: %s: %v\n", path, err)
			problems++
			return nil
		}
		if bytes.Equal(data, formatted) {
			return nil
		}

		if *write {
			info, err := os.Stat(path)
			if err != nil {
				return err
			}
			if err := os.WriteFile(path, formatted, info.Mode().Perm()); err != nil {
				return err
			}
			fmt.Printf("formatted: %s\n", path)
			return nil
		}

		fmt.Fprintf(os.Stderr, "needs formatting: %s\n", path)
		problems++
		return nil
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if problems > 0 {
		os.Exit(1)
	}
}

func formatJSON(data []byte) ([]byte, error) {
	dec := json.NewDecoder(bytes.NewReader(data))
	dec.UseNumber()

	tok, err := dec.Token()
	if err != nil {
		return nil, err
	}

	buf := &bytes.Buffer{}
	if err := writeToken(dec, buf, 0, tok); err != nil {
		return nil, err
	}

	if _, err := dec.Token(); err != io.EOF {
		if err == nil {
			return nil, fmt.Errorf("extra data after top-level value")
		}
		return nil, err
	}

	buf.WriteByte('\n')
	return buf.Bytes(), nil
}

func formatValue(dec *json.Decoder, buf *bytes.Buffer, level int) error {
	tok, err := dec.Token()
	if err != nil {
		return err
	}
	return writeToken(dec, buf, level, tok)
}

func writeToken(dec *json.Decoder, buf *bytes.Buffer, level int, tok json.Token) error {
	switch v := tok.(type) {
	case json.Delim:
		switch v {
		case '{':
			return writeObject(dec, buf, level)
		case '[':
			return writeArray(dec, buf, level)
		default:
			return fmt.Errorf("unexpected delimiter %q", v)
		}
	case string, json.Number, bool, nil:
		return writeJSONValue(buf, v)
	default:
		return writeJSONValue(buf, v)
	}
}

func writeObject(dec *json.Decoder, buf *bytes.Buffer, level int) error {
	buf.WriteByte('{')

	tok, err := dec.Token()
	if err != nil {
		return err
	}
	if delim, ok := tok.(json.Delim); ok && delim == '}' {
		buf.WriteByte('}')
		return nil
	}

	buf.WriteByte('\n')
	for {
		key, ok := tok.(string)
		if !ok {
			return fmt.Errorf("expected object key, got %T", tok)
		}
		writeIndent(buf, level+1)
		if err := writeJSONValue(buf, key); err != nil {
			return err
		}
		buf.WriteString(": ")
		if err := formatValue(dec, buf, level+1); err != nil {
			return err
		}

		tok, err = dec.Token()
		if err != nil {
			return err
		}
		if delim, ok := tok.(json.Delim); ok && delim == '}' {
			buf.WriteByte('\n')
			writeIndent(buf, level)
			buf.WriteByte('}')
			return nil
		}

		buf.WriteString(",\n")
	}
}

func writeArray(dec *json.Decoder, buf *bytes.Buffer, level int) error {
	buf.WriteByte('[')

	tok, err := dec.Token()
	if err != nil {
		return err
	}
	if delim, ok := tok.(json.Delim); ok && delim == ']' {
		buf.WriteByte(']')
		return nil
	}

	buf.WriteByte('\n')
	for {
		writeIndent(buf, level+1)
		if err := writeToken(dec, buf, level+1, tok); err != nil {
			return err
		}

		tok, err = dec.Token()
		if err != nil {
			return err
		}
		if delim, ok := tok.(json.Delim); ok && delim == ']' {
			buf.WriteByte('\n')
			writeIndent(buf, level)
			buf.WriteByte(']')
			return nil
		}

		buf.WriteString(",\n")
	}
}

func writeIndent(buf *bytes.Buffer, level int) {
	for i := 0; i < level; i++ {
		buf.WriteString(indent)
	}
}

func writeJSONValue(buf *bytes.Buffer, value interface{}) error {
	var tmp bytes.Buffer
	enc := json.NewEncoder(&tmp)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(value); err != nil {
		return err
	}
	b := tmp.Bytes()
	if len(b) > 0 && b[len(b)-1] == '\n' {
		b = b[:len(b)-1]
	}
	buf.Write(b)
	return nil
}
